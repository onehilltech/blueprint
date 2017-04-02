'use strict';

const express   = require ('express')
  , winston     = require ('winston')
  , util        = require ('util')
  , async       = require ('async')
  , objectPath  = require ('object-path')
  , _           = require ('underscore')
  , Policy      = require ('./Policy')
  , handleError = require ('./handleError')
  , HttpError   = require ('./errors/HttpError')
  ;


const SINGLE_ACTION_CONTROLLER_METHOD = '__invoke';
const SINGLE_RESOURCE_BASE_PATH = '/:rcId';

/**
 * Factory method that generates an action object.
 */
function makeAction (controller, method, opts) {
  var action = {action: controller + '@' + method};
  return _.extend (action, opts);
}

/**
 * Default function for handling an error returned via a VaSE callback.
 *
 * @param err
 * @param res
 * @param next
 * @returns {*}
 */

function validateBySchema (schema) {
  return function __blueprint_validate_schema (req, res, next) {
    try {
      req.check (schema);
      req.getValidationResult ().then (function (result) {
        // The fast path...
        if (result.isEmpty ())
          return next ();

        var err = new HttpError (400, 'validation_failed', 'Request validation failed', {validation: result.mapped ()});
        return handleError (err, res);
      });
    }
    catch (ex) {
      handleError (ex, res);
    }
  }
}

function validateByFunction (validator) {
  return function __blueprint_validate_function (req, res, next) {
    try {
      return validator (req, function (err) {
        if (err)
          return handleError (err, res);

        req.getValidationResult ().then (function (result) {
          // The fast path...
          if (result.isEmpty ())
            return next ();

          var err = new HttpError (400, 'validation_failed', 'Request validation failed', {validation: result.mapped ()});
          handleError (err, res);
        });
      });
    }
    catch (ex) {
      return handleError (ex, res);
    }
  }
}

function executor (execute) {
  return function __blueprint_execute (req, res, next) {
    try {
      return execute (req, res, function (err) {
        if (!err) return next ();
        return handleError (err, res);
      });
    }
    catch (ex) {
      return handleError (ex, res);
    }
  }
}

function sanitizer (sanitize) {
  return function __blueprint_sanitize (req, res, next) {
    try {
      return sanitize (req, function (err) {
        if (!err) return next ();
        return handleError (err, res);
      });
    }
    catch (ex) {
      return handleError (ex, res);
    }
  }
}

function render (view) {
  return function __blueprint_render (req, res) {
    res.render (view);
  };
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
function MethodCall (obj, method) {
  this._obj = obj;
  this._method = method;

  this.invoke = function () {
    return this._method.apply (this._obj, arguments);
  };
}

// The solution for endWith() is adopted from the following solution on
// StackOverflow:
//
//  http://stackoverflow.com/a/2548133/2245732

if (!_.isFunction (String.prototype.endsWith)) {
  String.prototype.endsWith = function (suffix) {
    return this.indexOf (suffix, this.length - suffix.length) !== -1;
  };
}

/**
 * @class RouterBuilder
 *
 * Builder class for building an express.Router object.
 *
 * @param app           Application object
 * @param basePath      Base path of the router
 * @constructor
 */
function RouterBuilder (app, basePath) {
  this._app = app;
  this._basePath = basePath || '/';
  this._router = express.Router ();
  this._params = [];
}

module.exports = RouterBuilder;

/**
 * Resolve the controller of an action.
 *
 * @param action
 * @returns {MethodCall}
 */
RouterBuilder.prototype._resolveController = function (action) {
  var parts = action.split ('@');

  if (parts.length < 1 || parts.length > 2)
    throw new Error (util.format ('invalid action format [%s]', action));

  var controllerName = parts[0];
  var actionName = parts.length === 2 ? parts[1] : SINGLE_ACTION_CONTROLLER_METHOD;

  // Locate the controller object in our loaded controllers. If the controller
  // does not exist, then throw an exception.
  var controllers = this._app.controllers;
  var controller = objectPath.get (controllers, controllerName);

  if (!controller)
    throw new Error (util.format ('controller %s not found', controllerName));

  // Locate the action method on the loaded controller. If the method does
  // not exist, then throw an exception.
  var method = controller[actionName];

  if (!method)
    throw new Error (util.format ('controller %s does not define method %s', controllerName, actionName));

  return new MethodCall (controller, method);
}

/**
 * Add routes defined by a specification.
 *
 * @param spec
 * @param currPath
 *
 * @returns {RouterBuilder}
 */
RouterBuilder.prototype.addSpecification = function (spec, currPath) {
  if (!currPath)
    currPath = this._basePath;

  if (_.isArray (spec) || _.isFunction (spec)) {
    // The specification is either an array of middleware, or a previously defined
    // router imported into this specification. An example of the latter case is
    // someone importing a router from an existing blueprint module.
    this._router.use (currPath, spec);
  }
  else if (_.isObject (spec)) {
    // The first step is to apply the policy in the specification, if exists. This
    // is because we need to determine if the current request can even access the
    // router path before we attempt to process it.
    if (spec.policy)
      this._router.use (currPath, Policy.middleware (spec.policy));

    // Next, we process any "use" methods.
    if (spec.use)
      this._processUse (currPath, spec.use);

    // Next, we start with the head verb since it must be defined before the get
    // verb. Otherwise, express will use the get verb over the head verb.
    if (spec.head)
      this._processToken ('head', currPath, spec.head);

    // The specification is a text-based key-value pair. We need to read each key
    // in the specification and apply it accordingly on the router.
    for (var key in spec) {
      if (!spec.hasOwnProperty (key) || key === 'head' || key === 'use' || key === 'policy')
        continue;

      // The first letter of the key is a hint at how to process this key's value.
      switch (key[0]) {
        case '/':
          var innerPath = currPath + (currPath.endsWith ('/') ? key.slice (1) : key);
          this.addSpecification (spec[key], innerPath);
          break;

        case ':':
          this.addParameter (key, spec[key]);
          break;

        default:
          this._processToken (key, currPath, spec[key]);
          break;
      }
    }
  }
  else {
    throw new Error ('Specification must be a object, router function, or an array of router functions');
  }

  return this;
};

/**
 * Register a route with the router. A router starts with a forward slash (/).
 *
 * @param token           String token
 * @param currPath        Current path for the specification
 * @param opts            Options for the path
 */
RouterBuilder.prototype._processToken = function processToken (token, currPath, opts) {
  switch (token) {
    case 'resource':
      this._defineResource (currPath, opts);
      break;

    default:
      this._defineVerbHandler (token, currPath, opts);
      break;
  }
};

/**
 * Process a resource path. The controller in this path must be an instance
 * of a ResourceController.
 */
RouterBuilder.prototype._defineResource = function (path, config) {
  // Define the resource specification.

  winston.log ('debug', 'processing resource %s', path);

  // Locate the controller specified in the options.
  var controllerName = config.controller;

  if (!controllerName)
    throw new Error (util.format ('%s is missing controller property', path));

  var controllers = this._app.controllers;
  var controller = objectPath.get (controllers, controllerName);

  if (!controller)
    throw new Error (util.format ('%s controller does not exist', controllerName));

  // Get the actions of the controller.
  var actions = controller.actions;

  if (!actions)
    throw new Error (util.format ('%s must define actions property', controllerName));

  var rcId = controller.resourceId;

  if (!rcId)
    throw new Error (util.format ('%s must define resourceId property', controllerName));

  if (config.allow && config.deny)
    throw new Error (util.format ('%s can only define allow or deny property, not both', path));

  // All actions in the resource controller are allowed from the beginning. We
  // adjust this collection based on the actions defined by the allow/deny property.

  var allowed = Object.keys (actions);

  if (config.allow)
    allowed = config.allow;

  if (config.deny) {
    // Remove the actions that are being denied.
    for (var i = 0, len = config.deny.length; i < len; ++ i)
      allowed.splice (allowed.indexOf (config.deny[i]), 1);
  }

  // Build the specification for managing the resource.
  var singleBasePath = '/:' + rcId;
  var spec = {};
  var singleSpec = {};

  // Set the policy for all actions of this resource controller.
  if (config.policy)
    spec.policy = config.policy;

  var actionOptions = config.actions || {};

  allowed.forEach (function (name) {
    var action = actions[name];
    var actionConfig = actionOptions[name] || {};

    if (_.isArray (action)) {
      action.forEach (function (item) {
        processAction (item);
      });
    }
    else if (_.isObject (action)) {
      processAction (action);
    }

    function processAction (action) {
      // The options for the action will inherit the options for the resource. It
      // will then take the configuration defined for the corresponding action.
      var actionOption = { };

      if (config.options)
        actionOption.options = config.options;

      actionOption = _.extend (actionOption, actionConfig);

      // If there is no policy explicitly specified, then auto-generate the policy
      // definition for the action. This will allow the developer to include the
      // policy in the correct directly for it to be auto-loaded.
      if (!actionOption.policy) {
        var namespace = controller.namespace;
        var prefix = '?';

        if (namespace)
          prefix += namespace + '.';

        actionOption.policy = prefix + controller.name + '.' + name;
      }

      if (action.path) {
        if (action.path.startsWith (SINGLE_RESOURCE_BASE_PATH)) {
          var part = action.path.slice (SINGLE_RESOURCE_BASE_PATH.length);

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

  this.addSpecification (spec, path)
};


/**
 * Define a handler for a single HTTP verb, such as get, put, and delete. The
 * value of \a verb can be any HTTP verb support by Express.js.
 *
 * @param     verb        HTTP verb
 * @param     path        Path associated with verb
 * @param     opts        Definition options
 */
RouterBuilder.prototype._defineVerbHandler = function (verb, path, opts) {
  var verbFunc = this._router[verb.toLowerCase ()];

  if (!verbFunc)
    throw new Error (util.format ('%s is not a valid http verb', verb));

  winston.log ('debug', 'processing %s %s', verb.toUpperCase (), path);

  // 1. validate
  // 2. sanitize
  // 3. policies
  // 4a. before
  // 4b. execute
  // 4c. after

  var middleware = [];

  if (_.isString (opts)) {
    middleware = middleware.concat (this._actionStringToMiddleware (opts, path));
  }
  else if (_.isArray (opts)) {
    // Add the array of functions to the middleware.
    middleware.push (opts);
  }
  else {
    // Make sure there is either an action or view defined.
    if (!((opts.action && !opts.view) || (!opts.action && opts.view)))
      throw new Error (util.format ('%s %s must define an action or view property', verb, path));

    if (opts.action) {
      middleware = this._actionStringToMiddleware (opts.action, path, opts);
    }
    else if (opts.view) {
      if (opts.policy)
        middleware.push (Policy.middleware (opts.policy));

      if (opts.before)
        middleware = middleware.concat (opts.before);

      middleware.push (render (opts.view));
    }

    // Add all middleware that should happen after processing.
    if (opts.after)
      middleware = middleware.concat (opts.after);
  }

  // Define the route path. Let's be safe and make sure there is no
  // empty middleware being added to the route.
  if (middleware.length > 0)
    verbFunc.call (this._router, path, middleware);
};

/**
 * Convert an action string to a array of middleware functions.
 *
 * @param action
 * @param path
 * @param opts
 * @returns {Array}
 */
RouterBuilder.prototype._actionStringToMiddleware = function (action, path, opts) {
  var middleware = [];
  opts = opts || {};

  // Resolve controller and its method. The expected format is controller@method. We are
  // also going to pass params to the controller method.
  var controller = this._resolveController (action);
  var params = {path: path};

  if (opts.options)
    params.options = opts.options;

  var result = controller.invoke (params);

  if (_.isFunction (result)) {
    // Push the function/array onto the middleware stack. If there is a policy,
    // then we need to push that before any of the functions.
    if (opts.policy)
      middleware.push (Policy.middleware (opts.policy));

    middleware.push (result);
  }
  else if (_.isArray (result)) {
    // Push the function/array onto the middleware stack. If there is a policy,
    // then we need to push that before any of the functions.
    if (opts.policy)
      middleware.push (Policy.middleware (opts.policy));

    middleware = middleware.concat (result);
  }
  else if (_.isObject (result)) {
    // The user elects to have separate validation, sanitize, and execution
    // section for the controller method. There must be a execution function.
    if (!result.execute)
      throw new Error (util.format ('Controller method must define an \'execute\' property [%s %s]', verb, path));

    // The controller method has the option of validating and sanitizing the
    // input data. We need to check for either one and add middleware functions
    // if it exists.
    if (result.validate) {
      var validate = result.validate;

      if (_.isFunction (validate)) {
        // The method has its own validation function.
        middleware.push (validateByFunction (validate));
      }
      else if (_.isObject (validate) && !_.isArray (validate)) {
        // The method is using a express-validator schema for validation.
        middleware.push (validateBySchema (validate));
      }
      else {
        throw new Error (util.format ('Unsupported validate value [%s]', util.inspect (validate)));
      }
    }

    if (result.sanitize)
      middleware.push (sanitizer (result.sanitize));

    if (opts.policy)
      middleware.push (Policy.middleware (opts.policy));

    if (opts.before)
      middleware = middleware.concat (opts.before);

    // Lastly, push the execution function onto the middleware stack.
    middleware.push (executor (result.execute));
  }

  return middleware;
};

/**
 * Process the <use> statement in the router. If the path is defined, then the
 * handlers are bound to the path. If there is no path, then the handlers are
 * used for all paths.
 *
 * @param path
 * @param handlers
 */
RouterBuilder.prototype._processUse = function (path, handlers) {
  winston.log ('debug', 'processing use %s', path);
  this._router.use (path, handlers);
};

/**
 *
 * @param param
 * @param opts
 * @param override
 */
RouterBuilder.prototype.addParameter = function (param, opts, override) {
  winston.log ('debug', 'processing parameter %s', param);

  // We only add a parameter once unless we are overriding the existing
  // parameter definition.
  if (this._params.indexOf (param) !== -1 && !override)
    return;

  var rawParam = param.slice (1);
  var handler;

  if (_.isFunction (opts)) {
    handler = opts;
  }
  else if (_.isObject (opts)) {
    if (opts.action) {
      // The parameter invokes an operation on the controller.
      var controller = this._resolveController (opts.action);
      handler = controller.invoke ();
    }
    else {
      throw new Error ('Invalid parameter specification (' + param + ')');
    }
  }
  else {
    throw new Error (util.format ('opts must be a Function or Object [param=%s]', param));
  }

  if (handler != null)
    this._router.param (rawParam, handler);

  // Cache the parameter so we do not add it more than once.
  if (this._params.indexOf (param) === -1)
    this._params.push (param);
};

/**
 * Get the router.
 *
 * @returns {*}
 */
RouterBuilder.prototype.getRouter = function () {
  return this._router;
};

RouterBuilder.prototype.addRouters = function (routers) {
  for (var key in routers) {
    if (routers.hasOwnProperty (key)) {
      var value = routers[key];
      
      if (_.isFunction (value) || _.isArray (value))
        this._router.use (value);
      else
        this.addRouters (value);
    }
  }

  return this;
};
