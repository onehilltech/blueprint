const BlueprintObject = require ('./object');
const assert  = require ('assert');
const debug   = require ('debug')('blueprint:RouterBuilder');
const express = require ('express');

const {
  checkSchema,
} = require ('express-validator/check');

const {
  forOwn,
  isFunction,
  isObjectLike,
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
  legacyValidator
} = require ('./middleware');

const {
  check,
  policyMaker,
} = require ('./policies');

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
const MethodCall = BlueprintObject.extend ({
  invoke () {
    return this.method.apply (this.obj, arguments);
  }
});

module.exports = BlueprintObject.extend ({
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
    if (isRouter (router)) {
      debug (`adding router for ${route}`);

      this._routers.push ({ path: route, router: router.build (this.app) });
    }
    else {
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
    debug (`adding router specification to ${route}`);

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
    debug (`adding route ${route} to router at ${currentPath}`);

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
      throw new Error (`Parameter specification must be a Function or BlueprintObject [param=${param}]`);
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
      // Let the user know they should migrate the using actions.
      console.warn (`*** deprecated: ${action}: Controller actions should return an Action class, not a function`);

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
      console.warn (`*** deprecated: ${action}: Controller actions should return an Action class, not an array of functions`);

      if (opts.policy)
        middleware.push (this._makePolicyMiddleware (opts.policy));

      middleware.push (result);
    }
    else if (isObjectLike (result) || result.length === 0) {
      if (result.length === 0)
        result = new result ({controller: controllerAction.obj});
      else
        console.warn (`*** deprecated: ${action}: Controller actions should return an Action class, not an object-like action`);

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
        middleware.push (checkSchema (schema));
      }

      // The controller method has the option of validating and sanitizing the
      // input data dynamically. We need to check for either one and add middleware
      // functions if it exists.
      if (validate || sanitize) {
        // The validator can be a f(req) middleware function, an object-like
        // schema, or a array of validator middleware functions.

        if (validate) {
          if (isFunction (validate)) {
            // We either have an legacy validation function, or a middleware function.
            switch (validate.length) {
              case 2:
                console.warn (`*** deprecated: ${action}: validate function must have the signature f(req,res,next)`);
                middleware.push (legacyValidator (validate));
                break;

              case 3:
                middleware.push (validate);
                break;

              default:
                throw new Error (`Validate function must have the signature f(req,res,next)`);
            }
          }
          else if (isArray (validate)) {
            // We have a middleware function, or an array of middleware functions.
            middleware.push (validate);
          }
          else if (isObjectLike (validate)) {
            console.warn (`*** deprecated: ${action}: Validation schema must be declared on the 'schema' property`);

            // We have an express-validator schema.
            let schema = this._normalizeSchema (validate);
            middleware.push (checkSchema (schema));
          }
          else {
            throw new Error (`validate must be a f(req, res, next), [...f(req, res, next)], or BlueprintObject-like validation schema [path=${path}]`);
          }
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
        }
      }

      // Push the middleware that will evaluate the validation result. If the
      // validation fails, then this middleware will stop the request's progress.
      if (validate || sanitize || schema)
        middleware.push (handleValidationResult);

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
      throw new Error (`Controller action expected to return a Function, BlueprintObject, or an Action`);
    }

    return flattenDeep (middleware);
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
    const validatorNames = Object.keys (this.validators || {});
    const sanitizerNames = Object.keys (this.sanitizers || {});

    return mapValues (schema, (definition) => {
      return transform (definition, (result, value, key) => {
        if (validatorNames.includes (key)) {
          result.custom = {
            options: this.validators[key]
          };
        }
        else if (sanitizerNames.includes (key)) {
          result.customSanitizer = {
            options: this.sanitizers[key]
          }
        }
        else {
          result[key] = value;
        }
      }, {});
    });
  }
});
