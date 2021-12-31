/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { BO }  = require ('base-object');
const assert  = require ('assert');
const debug   = require ('debug')('blueprint:RouterBuilder');
const express = require ('express');
const { checkSchema } = require ('express-validator/check');
const path    = require ('path');
const Router  = require ('./router');
const util = require ('util');

const {
  forOwn,
  isFunction,
  isObjectLike,
  isPlainObject,
  isString,
  flattenDeep,
  isArray,
  extend,
  mapValues,
  transform,
  get
} = require ('lodash');

const {
  checkPolicy,
  executeAction,
  handleValidationResult,
  render,
  legacySanitizer,
  legacyValidator,
  actionValidator
} = require ('./middleware');

const check = require ('./policies/check');
const policyFactory = require ('./policies/policy-factory');

const SINGLE_ACTION_CONTROLLER_METHOD = '__invoke';
const SINGLE_RESOURCE_BASE_PATH = '/:rcId';

/**
 * Test if the object is a router.
 *
 * @param r
 * @returns {boolean}
 */
function isRouter (r) {
  return !!r.specification;
}

/**
 * Factory method that generates an action object.
 */
function makeAction (controller, method, opts) {
  const action = `${controller}@${method}`;
  return extend ({ action }, opts);
}

/**
 * @class MethodCall
 *
 * Helper class for using reflection to call a method.
 */
class MethodCall {
  constructor (obj, method) {
    this.obj = obj;
    this.method = method;
  }

  invoke () {
    return this.method.call (this.obj, ...arguments);
  }
}

module.exports = class RouterBuilder {
  basePath = '/';

  _router = null;

  validators = null;

  sanitizers = null;

  app = null

  constructor (app) {
    this.app = app;

    assert (!!this.app, 'You must define the app property.');

    this._specs = [];
    this._routers = [];
  }

  /**
   * Add a specification to the router.
   *
   * @param spec
   * @returns {RouterBuilder}
   */
  addSpecification (spec) {
    this._specs.push (spec);
    return this;
  }

  /**
   * Add a router to the router. The newly added router will be considered
   * a sub-router of the current router.
   *
   * @param route
   * @param router
   * @returns {RouterBuilder}
   */
  addRouter (route, router) {
    if (isPlainObject (router)) {
      this.addSpecification (router);
    }
    else if (isRouter (router)) {
      this._routers.push ({ path: route, router });
    }
    else {
      throw new Error (`The router for ${route} is invalid.`);
    }

    return this;
  }

  /**
   * Build the router.
   *
   * @returns {Promise<null>}
   */
  async build () {
    this._router = express.Router ();

    // Add each specification and pre-built router to the router.
    for await (const spec of this._specs)
      this._processRouterSpecification (this.basePath, spec);

    // Add the routes to the mix.
    for await (const router of this._routers) {
      const result = await router.build (this.app);
      this._router.use (router.path, result);
    }

    return this._router;
  }

  /**
   * Build the router specification to the current router.
   *
   * @param route
   * @param spec
   */
  async _processRouterSpecification (route, spec) {
    if (isFunction (spec) && spec.name === 'router') {
      // The spec is an express.Router. We can just use it directly in the
      // router and continue on our merry way.
      this._router.use (route, spec);
    }
    else if (isPlainObject (spec)) {
      // The first step is to apply the policy in the specification, if exists. This
      // is because we need to determine if the current request can even access the
      // router path before we attempt to process it.

      if (spec.policy) {
        const middleware = await this._processMiddlewarePolicy (spec.policy);

        if (middleware.length)
          this._router.use (route, middleware);
      }

      // Next, we process any "use" methods.

      if (spec.use)
        this._router.use (route, spec.use);

      // Next, we start with the head verb since it must be defined before the other
      // verbs. Otherwise, express will process the actions in the incorrect order.

      if (spec.head)
        await this._processToken (route, 'head', spec.head);

      forOwn (spec, async (value, key) => {
        // We ignore the following keys since we have already processed them. We
        // do not want to include the actions multiple times.

        if (['head', 'use', 'policy'].includes (key))
          return;

        switch (key[0])
        {
          case '/':
            await this._processRoute (route, key, value);
            break;

          case ':':
            await this._processParameter (key, value);
            break;

          default:
            await this._processToken (route, key, value);
        }
      });
    }
  }

  /**
   * Process a token from the router specification.
   *
   * @param route
   * @param token
   * @param value
   * @private
   */
  async _processToken (route, token, value) {
    switch (token) {
      case 'resource':
        await this._processResource (route, value);
        break;

      default:
        await this._processMethod (route, token, value);
        break;
    }
  }

  /**
   * Define a method/verb on the router for the route.
   *
   * @param route
   * @param method
   * @param opts
   * @private
   */
  async _processMethod (route, method, opts) {
    debug (`processing ${method.toUpperCase ()} ${route}`);

    const verbFunc = this._router[method.toLowerCase ()];

    if (!verbFunc)
      throw new Error (`${method} is not a supported http verb`);

    // 1. validate
    // 2. sanitize
    // 3. policies
    // 4a. before
    // 4b. execute
    // 4c. after

    const middleware = [];

    if (isString (opts)) {
      const result = await this._actionStringToMiddleware (opts, route);
      middleware.push (result);
    }
    else if (isArray (opts)) {
      // Add the array of functions to the middleware.
      middleware.push (opts);
    }
    else {
      // Make sure there is either an action or view defined.
      if (!(!!opts.action ^ !!opts.view))
        throw new Error (`${method} ${route} must define an action or view property, but not both`);

      if (opts.action) {
        const result = await this._actionStringToMiddleware (opts.action, route, opts);
        middleware.push (result);
      }
      else if (opts.view) {
        if (opts.policy) {
          const result = await this._processMiddlewarePolicy (opts.policy);
          middleware.push (result);
        }

        middleware.push (render (opts.view));
      }
    }

    // Define the route route. Let's be safe and make sure there is no
    // empty middleware being added to the route.

    if (middleware.length) {
      let stack = flattenDeep (middleware);
      verbFunc.call (this._router, route, stack);
    }
  }

  /**
   * Process a resource specification.
   *
   * @param route
   * @param opts
   * @returns {Promise<void>}
   * @private
   */
  async _processResource (route, opts) {
    debug (`defining resource ${route}`);

    const spec = this._makeRouterSpecificationForResource (route, opts);
    await this._processRouterSpecification (route, spec);
  }

  /**
   * Process a route specification.
   *
   * @param currentPath
   * @param route
   * @param definition
   * @returns {Promise<void>}
   * @private
   */
  async _processRoute (currentPath, route, definition) {
    const fullPath = path.resolve (currentPath, route);

    debug (`adding ${route} at ${currentPath}`);

    const routerPath = currentPath !== '/' ? `${currentPath}${route}` : route;

    await this._processRouterSpecification (routerPath, definition);
  }

  /**
   * Add a parameter to the active router.
   *
   * @param param
   * @param opts
   * @private
   */
  _processParameter (param, opts) {
    debug (`adding parameter ${param} to router`);

    let handler;

    if (isFunction (opts)) {
      handler = opts;
    }
    else if (isObjectLike (opts)) {
      if (opts.action) {
        // The parameter invokes an operation on the controller.
        let controller = this._resolveControllerAction (opts.action);

        if (!controller)
          throw new Error (`Cannot resolve controller action for parameter [action=${opts.action}]`);

        handler = controller.invoke ();
      }
      else {
        throw new Error (`Invalid parameter specification [param=${param}]`);
      }
    }
    else {
      throw new Error (`Parameter specification must be a Function or BO [param=${param}]`);
    }

    this._router.param (param.slice (1), handler);
  }

  /**
   * Make a router specification for the resource definition.
   *
   * @param route
   * @param opts
   * @returns {{}}
   * @private
   */
  _makeRouterSpecificationForResource (route, opts) {
    // Locate the controller specified in the options.
    let controllerName = opts.controller;

    if (!controllerName)
      throw new Error (`${path} is missing controller property`);

    const { resources: { controllers }} = this.app;
    let controller = get (controllers, controllerName);

    if (!controller)
      throw new Error (`${controllerName} controller does not exist`);

    // Get the actions of the controller.
    let {actions, namespace, name} = controller;

    if (!actions)
      throw new Error (`${controllerName} must define actions property`);

    let {resourceId} = controller;

    if (!resourceId)
      throw new Error (`${controllerName} must define resourceId property`);

    const {allow, deny, policy} = opts;

    if (allow && deny)
      throw new Error (`${route} can only define allow or deny property, not both`);

    // All actions in the resource controller are allowed from the beginning. We
    // adjust this collection based on the actions defined by the allow/deny property.

    let allowed = Object.keys (actions);

    if (allow)
      allowed = allow;

    if (deny) {
      // Remove the actions that are being denied.
      for (let i = 0, len = deny.length; i < len; ++ i)
        allowed.splice (allowed.indexOf (deny[i]), 1);
    }

    // Build the specification for managing the resource.
    let singleBasePath = `/:${resourceId}`;
    let spec = {};
    let singleSpec = {};

    // Set the policy for all actions of this resource controller.
    if (policy)
      spec.policy = policy;

    let actionOptions = opts.actions || {};

    allowed.forEach (actionName => {
      let action = actions[actionName];
      let actionConfig = actionOptions[actionName] || {};

      if (isArray (action)) {
        action.forEach (item => processAction (item));
      }
      else if (isObjectLike (action)) {
        processAction (action);
      }

      function processAction (action) {
        // The options for the action will inherit the options for the resource. It
        // will then take the configuration defined for the corresponding action.
        let actionOption = { };

        let {options} = opts;

        if (options)
          actionOption.options = options;

        actionOption = extend (actionOption, actionConfig);

        // If there is no policy explicitly specified, then auto-generate the policy
        // definition for the action. This will allow the developer to include the
        // policy in the correct directly for it to be auto-loaded.
        if (!actionOption.policy) {
          let prefix = '?';

          if (namespace)
            prefix += `${namespace}.`;

          const policyName = `${prefix}${name}.${actionName}`;
          actionOption.policy = check (policyName);
        }

        if (action.path) {
          if (action.path.startsWith (SINGLE_RESOURCE_BASE_PATH)) {
            let part = action.path.slice (SINGLE_RESOURCE_BASE_PATH.length);

            if (part.length === 0) {
              // We are working with an action for a single resource.
              singleSpec[action.verb] = makeAction (controllerName, action.method, actionOption);
            }
            else {
              if (!singleSpec[part])
                singleSpec[part] = {};

              singleSpec[part][action.verb] = makeAction (controllerName, action.method, actionOption);
            }
          }
          else {
            // We are working with an action for the collective resources.
            spec[action.path] = {};
            spec[action.path][action.verb] = makeAction (controllerName, action.method, actionOption);
          }
        }
        else {
          // We are working with an action for the collective resources.
          spec[action.verb] = makeAction (controllerName, action.method, actionOption);
        }
      }
    });

    // Add the specification for managing a since resource to the specification
    // for managing all the resources.
    spec[singleBasePath] = singleSpec;

    return spec;
  }

  /**
   * Convert an action string to a express middleware function.
   *
   * @param action
   * @param path
   * @param opts
   * @returns {Array}
   * @private
   */
  async _actionStringToMiddleware (action, path, opts = {}) {
    const middleware = [];

    // Resolve controller and its method. The expected format is controller@method. We are
    // also going to pass params to the controller method.
    let controllerAction = this._resolveControllerAction (action);
    let params = { path };

    if (opts.options)
      params.options = opts.options;

    let result = controllerAction.invoke (params);

    if (isFunction (result) && (result.length === 2 || result.length === 3)) {
      // Push the function/array onto the middleware stack. If there is a policy,
      // then we need to push that before we push the function onto the middleware
      // stack.

      if (opts.policy)
        middleware.push (await this._processMiddlewarePolicy (opts.policy));

      middleware.push (result);
    }
    else if (isArray (result)) {
      // Push the function/array onto the middleware stack. If there is a policy,
      // then we need to push that before any of the functions.

      if (opts.policy)
        middleware.push (await this._processMiddlewarePolicy (opts.policy));

      middleware.push (result);
    }
    else if (isPlainObject (result) || (result.prototype && result.prototype.execute)) {
      const plainObject = !(result.prototype && result.prototype.execute);

      if (!plainObject) {
        // Create the action object, and configure it.
        result = new result ();

        if (isFunction (result.configure))
          await result.configure (controllerAction.obj);
      }

      // The user elects to have separate validation, sanitize, and execution
      // section for the controller method. There must be a execution function.
      let { validate, execute, schema } = result;

      if (!execute)
        throw new Error (`Controller action must define an \'execute\' property [${path}]`);

      // Perform static checks first.

      if (schema) {
        // We have an express-validator schema. The validator and sanitizer should
        // be built into the schema.
        schema = this._normalizeSchema (schema);
        middleware.push ([checkSchema (schema), handleValidationResult]);
      }

      // The controller method has the option of validating and sanitizing the
      // input data dynamically. We need to check for either one and add middleware
      // functions if it exists.

      if (validate) {
        if (validate) {
          // The validator can be a f(req) middleware function, an object-like
          // schema, or a array of validator middleware functions.

          if (isFunction (validate)) {
            if (plainObject) {
              middleware.push (validate);
            }
            else {
              // The validate method is on the action object. We need to pass it
              // to the action validator middleware.
              middleware.push (actionValidator (result))
            }
          }
          else if (isArray (validate)) {
            // We have a middleware function, or an array of middleware functions.
            middleware.push (validate);
          }
          else {
            throw new Error (`validate must be a f(req, res, next), [...f(req, res, next)], or object-like validation schema [path=${path}]`);
          }

          // Push the middleware that will evaluate the validation result. If the
          // validation fails, then this middleware will stop the request's progress.
          middleware.push (handleValidationResult);
        }
      }

      // The request is validated and the data has been sanitized. We can now work
      // on the actual data in the request. Let's check the policies for the request
      // and then execute it.
      let {policy} = opts;

      if (policy)
        middleware.push (await this._processMiddlewarePolicy (policy));

      // Lastly, push the execution function onto the middleware stack. If the
      // execute takes 2 parameters, we are going to assume it returns a Promise.
      // Otherwise, it is a middleware function.

      switch (execute.length)
      {
        case 2:
          // The execute method is returning a Promise.
          middleware.push (executeAction (result));
          break;

        case 3:
          // The execute method is a middleware function.
          middleware.push (execute);
          break;
      }
    }
    else {
      throw new Error (`Controller action expected to return a Function, BO, or an Action`);
    }

    return middleware;
  }

  /**
   * Resolve a controller from an action specification.
   *
   * @param action
   * @private
   */
  _resolveControllerAction (action) {
    let [controllerName, actionName] = action.split ('@');

    if (!controllerName)
      throw new Error (`The action must include a controller name [${action}]`);

    if (!actionName)
      actionName = SINGLE_ACTION_CONTROLLER_METHOD;

    // Locate the controller object in our loaded controllers. If the controller
    // does not exist, then throw an exception.
    const { resources: { controllers }} = this.app;
    const controller = get (controllers, controllerName);

    if (!controller)
      throw new Error (`${controllerName} not found`);

    // Locate the action method on the loaded controller. If the method does
    // not exist, then throw an exception.
    const method = controller[actionName];

    if (!method)
      throw new Error (`${controllerName} does not define method ${actionName}`);

    return new MethodCall (controller, method);
  }

  /**
   * Make a policy middleware from the policy.
   *
   * @param definition      The policy definition
   * @private
   */
  async _processMiddlewarePolicy (definition) {
    const policy = await policyFactory (definition, this.app);
    return [checkPolicy (policy)];
  }

  /**
   * Normalize the validation schema. This will convert all custom policies
   * into the expected definition for express-validator.
   *
   * @param schema
   * @private
   */
  _normalizeSchema (schema) {
    const { validators, sanitizers } = this.app.resources;
    const validatorNames = Object.keys (validators || {});
    const sanitizerNames = Object.keys (sanitizers || {});

    return mapValues (schema, definition =>
      transform (definition, (result, value, key) => {
        if (validatorNames.includes (key)) {
          result.custom = {
            options: validators[key]
          };
        }
        else if (sanitizerNames.includes (key)) {
          result.customSanitizer = {
            options: sanitizers[key]
          }
        }
        else {
          result[key] = value;
        }
      }, {}));
  }
}
