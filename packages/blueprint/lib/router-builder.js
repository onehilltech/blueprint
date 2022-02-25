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

const { check, policyMaker } = require ('./policies');

const SINGLE_ACTION_CONTROLLER_METHOD = '__invoke';
const SINGLE_RESOURCE_BASE_PATH = '/:rcId';

function isRouter (r) {
  return !!r.specification && !!r.build;
}

/**
 * Factory method that generates an action object.
 */
function makeAction (controller, method, opts) {
  let action = {action: controller + '@' + method};
  return extend (action, opts);
}

/**
 * @class MethodCall
 *
 * Helper class for using reflection to call a method.
 *
 * @param obj
 * @param method
 * @constructor
 */
const MethodCall = BO.extend ({
  invoke () {
    return this.method.apply (this.obj, arguments);
  }
});

module.exports = BO.extend ({
  basePath: '/',

  _router: null,

  validators: null,

  sanitizers: null,

  app: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.app, 'You must define the {app} property.');

    this._specs = [];
    this._routers = [];
  },

  addSpecification (spec) {
    this._specs.push (spec);
    return this;
  },

  addRouter (route, router) {
    if (isPlainObject (router)) {
      debug (`adding nested routers: [${Object.keys (router)}]`);

      forOwn (router, (value, key) => {
        if (isRouter (value)) {
          this.addRouter (route, value);
        }
        else {
          let childRoute = `${route}${key}/`;
          this.addRouter (childRoute, value);
        }
      });
    }
    else {
      debug (`building/adding child router for ${route};\n${util.inspect (router.specification)}]\n\n`);

      this._routers.push ({ path: route, router: router.build (this.app) });
    }

    return this;
  },

  build () {
    this._router = express.Router ();

    // Add each specification and pre-built router to the router.
    this._specs.forEach (spec => this._addRouterSpecification (this.basePath, spec));
    this._routers.forEach (router => this._router.use (router.path, router.router));

    return this._router;
  },

  /**
   * Add a router specification to the current router.
   *
   * @param route
   * @param spec
   */
  _addRouterSpecification (route, spec) {
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
        let middleware = this._makePolicyMiddleware (spec.policy);

        if (middleware.length)
          this._router.use (route, middleware);
      }

      // Next, we process any "use" methods.
      if (spec.use)
        this._router.use (route, spec.use);

      // Next, we start with the head verb since it must be defined before the get
      // verb. Otherwise, express will use the get verb over the head verb.
      if (spec.head)
        this._processToken (route, 'head', spec.head);

      forOwn (spec, (value, key) => {
        if (['head', 'use', 'policy'].includes (key))
          return;

        switch (key[0])
        {
          case '/':
            this._addRoute (route, key, value);
            break;

          case ':':
            this._addParameter (key, value);
            break;

          default:
            this._processToken (route, key, value);
        }
      });
    }
  },

  /**
   * Process a token from the router specification.
   *
   * @param route
   * @param token
   * @param value
   * @private
   */
  _processToken (route, token, value) {
    switch (token) {
      case 'resource':
        this._addResource (route, value);
        break;

      default:
        this._addMethod (route, token, value);
        break;
    }
  },

  /**
   * Define a verb on the router for the route.
   *
   * @param route
   * @param method
   * @param opts
   * @private
   */
  _addMethod (route, method, opts) {
    debug (`defining ${method.toUpperCase ()} ${route}`);

    let verbFunc = this._router[method.toLowerCase ()];

    if (!verbFunc)
      throw new Error (`${method} is not a supported http verb`);

    // 1. validate
    // 2. sanitize
    // 3. policies
    // 4a. before
    // 4b. execute
    // 4c. after

    let middleware = [];

    if (isString (opts)) {
      middleware.push (this._actionStringToMiddleware (opts, route));
    }
    else if (isArray (opts)) {
      // Add the array of functions to the middleware.
      middleware.push (opts);
    }
    else {
      // Make sure there is either an action or view defined.
      if (!((opts.action && !opts.view) || (!opts.action && opts.view)))
        throw new Error (`${method} ${route} must define an action or view property`);

      // Add all middleware that should happen before execution. We are going
      // to be deprecating this feature after v4 release.

      if (opts.before)
        middleware.push (opts.before);

      if (opts.action) {
        middleware.push (this._actionStringToMiddleware (opts.action, route, opts));
      }
      else if (opts.view) {
        if (opts.policy)
          middleware.push (this._makePolicyMiddleware (opts.policy));

        middleware.push (render (opts.view));
      }

      // Add all middleware that should happen after execution. We are going
      // to be deprecating this feature after v4 release.
      if (opts.after)
        middleware.push (opts.after);
    }

    // Define the route route. Let's be safe and make sure there is no
    // empty middleware being added to the route.

    if (middleware.length) {
      let stack = flattenDeep (middleware);
      verbFunc.call (this._router, route, stack);
    }
  },

  _addResource (route, opts) {
    debug (`defining resource ${route}`);

    const spec = this._makeRouterSpecificationForResource (route, opts);
    this._addRouterSpecification (route, spec);
  },

  _addRoute (currentPath, route, definition) {
    let fullPath = path.resolve (currentPath, route);

    debug (`adding ${route} at ${currentPath}`);

    let routerPath = currentPath !== '/' ? `${currentPath}${route}` : route;

    this._addRouterSpecification (routerPath, definition);
  },

  /**
   * Add a parameter to the active router.
   *
   * @param param
   * @param opts
   * @private
   */
  _addParameter (param, opts) {
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
  },

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

    let controller = get (this.app.resources.controllers, controllerName);

    if (!controller)
      throw new Error (`${controllerName} controller does not exist`);

    // Get the actions of the controller.
    let {actions,namespace,name} = controller;

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

    allowed.forEach (function (actionName) {
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
            prefix += namespace + '.';

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
  },

  /**
   * Convert an action string to a express middleware function.
   *
   * @param action
   * @param path
   * @param opts
   * @returns {Array}
   * @private
   */
  _actionStringToMiddleware (action, path, opts = {}) {
    let middleware = [];

    // Resolve controller and its method. The expected format is controller@method. We are
    // also going to pass params to the controller method.
    let controllerAction = this._resolveControllerAction (action);
    let params = {path};

    if (opts.options)
      params.options = opts.options;

    let result = controllerAction.invoke (params);

    if (isFunction (result) && (result.length === 2 || result.length === 3)) {
      // Push the function/array onto the middleware stack. If there is a policy,
      // then we need to push that before we push the function onto the middleware
      // stack.

      if (opts.policy)
        middleware.push (this._makePolicyMiddleware (opts.policy));

      middleware.push (result);
    }
    else if (isArray (result)) {
      // Push the function/array onto the middleware stack. If there is a policy,
      // then we need to push that before any of the functions.

      if (opts.policy)
        middleware.push (this._makePolicyMiddleware (opts.policy));

      middleware.push (result);
    }
    else if (isPlainObject (result) || (result.prototype && result.prototype.execute)) {
      let plainObject = !(result.prototype && result.prototype.execute);

      if (!plainObject)
        result = new result ({controller: controllerAction.obj});

      // The user elects to have separate validation, sanitize, and execution
      // section for the controller method. There must be a execution function.
      let {validate, sanitize, execute, schema} = result;

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
      if (validate || sanitize) {
        if (validate) {
          // The validator can be a f(req) middleware function, an object-like
          // schema, or a array of validator middleware functions.

          if (isFunction (validate)) {
            if (plainObject) {
              switch (validate.length) {
                case 2:
                  middleware.push (legacyValidator (validate));
                  break;

                case 3:
                  // This is a Express middleware function
                  middleware.push (validate);
                  break;
              }
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
          else if (isPlainObject (validate)) {
            console.warn (`*** deprecated: ${action}: Validation schema must be declared on the 'schema' property`);

            // We have an express-validator schema.
            let schema = this._normalizeSchema (validate);
            middleware.push (checkSchema (schema));
          }
          else {
            throw new Error (`validate must be a f(req, res, next), [...f(req, res, next)], or object-like validation schema [path=${path}]`);
          }

          // Push the middleware that will evaluate the validation result. If the
          // validation fails, then this middleware will stop the request's progress.
          middleware.push (handleValidationResult);
        }

        // The optional sanitize must be a middleware f(req,res,next). Let's add this
        // after the validation operation.
        if (sanitize) {
          console.warn (`*** deprecated: ${action}: Define sanitize operations on the 'validate' or 'schema' property.`);

          if (isFunction (sanitize)) {
            switch (sanitize.length) {
              case 2:
                middleware.push (legacySanitizer (sanitize));
                break;

              default:
                throw new Error (`Sanitize function must have the signature f(req,res,next)`);
            }
          }
          else if (isArray (sanitize)) {
            middleware.push (sanitize);
          }
          else if (isObjectLike (sanitize)) {
            console.warn (`*** deprecated: ${action}: Sanitizing schema must be declared on the 'schema' property`);

            // We have an express-validator schema.
            let schema = this._normalizeSchema (sanitize);
            middleware.push (checkSchema (schema));
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
        middleware.push (this._makePolicyMiddleware (policy));

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
  },

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
    let controller = get (this.app.resources.controllers, controllerName);

    if (!controller)
      throw new Error (`${controllerName} not found`);

    // Locate the action method on the loaded controller. If the method does
    // not exist, then throw an exception.
    let method = controller[actionName];

    if (!method)
      throw new Error (`${controllerName} does not define method ${actionName}`);

    return new MethodCall ({ obj: controller, method });
  },

  /**
   * Make a policy middleware from the policy.
   *
   * @param policy      Policy object
   * @private
   */
  _makePolicyMiddleware (definition) {
    let policy = policyMaker (definition, this.app);
    return policy !== null ? [checkPolicy (policy)] : [];
  },

  /**
   * Normalize the validation schema. This will convert all custom policies
   * into the expected definition for express-validator.
   *
   * @param schema
   * @private
   */
  _normalizeSchema (schema) {
    const {validators, sanitizers} = this.app.resources;
    const validatorNames = Object.keys (validators || {});
    const sanitizerNames = Object.keys (sanitizers || {});

    return mapValues (schema, (definition) => {
      return transform (definition, (result, value, key) => {
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
      }, {});
    });
  }
});
