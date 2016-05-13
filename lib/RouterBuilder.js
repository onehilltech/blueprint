var express = require ('express')
  , winston = require ('winston')
  , util    = require ('util')
  ;

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

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

/**
 * @class RouterBuilder
 *
 * Builder class for building an express.Router object.
 *
 * @param routerPath
 * @param controllers
 * @param currPath
 * @constructor
 */
function RouterBuilder (controllers, basePath) {
  this._controllers = controllers;
  this._basePath = basePath || '/';
  this._router = express.Router ();
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
  var self = this;

  /**
   * Resolve the controller of an action.
   *
   * @param action
   * @returns {MethodCall}
   */
  function resolveController (action) {
    var parts = action.split ('@');

    if (parts.length != 2)
      throw new Error (util.format ('invalid action format [%s]', action));

    var controllerName = parts[0];
    var actionName = parts[1];

    // Locate the controller object in our loaded controllers. If the controller
    // does not exist, then throw an exception.
    var controller = self._controllers[controllerName];

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
   * Register a route with the router. A router starts with a forward slash (/).
   *
   * @param currPath        Current path for the specification
   * @param route           Router specification
   * @param basePath        Base to add to the current path
   */
  function processHttpVerb (verb, currPath, opts) {
    var verbFunc = self._router[verb.toLowerCase ()];

    if (!verbFunc)
      throw new Error (util.format ('%s is not a valid http verb', verb));

    winston.log ('debug', 'processing %s %s', verb.toUpperCase (), currPath);

    // Make sure there is either an action or view defined.
    if (opts.action === undefined && opts.view === undefined)
      throw new Error (util.format ('%s %s must define an action or view property', verb, currPath));

    var middleware = opts.before || [];

    if (opts.action) {
      // Resolve controller and its method. The expected format is controller@method.
      var controller = resolveController (opts.action);
      var result = controller.invoke ();
      var resultType = typeof result;

      if (resultType === 'function') {
        // Push the function onto the middleware stack.
        middleware.push (result);
      }
      else if (resultType === 'object') {
        // The user elects to have separate validation, sanitize, and execution
        // section for the controller method. There must be a execution function.
        if (!result.execute)
          throw new Error ('Controller method must define an \'execute\' property');

        if (result.validate)
          middleware.push (result.validate);

        if (result.sanitize)
          middleware.push (result.sanitize);

        // Lastly, push the execution function onto the middleware stack.
        middleware.push (result.execute);
      }
      else {
        throw new Error ('Return type of controller method must be a function or object');
      }
    }
    else if (opts.view) {
      // Use a generic callback to render the view. Make sure we save a reference
      // to the target view since the opts variable will change during the next
      // iteration.
      var view = opts.view;

      middleware.push (function renderView (req, res, next) {
        res.render (view);
        if (next) return next ();
      });
    }

    // Add all middleware that should happen after processing.
    if (opts.after)
      middleware = middleware.concat (opts.after);

    // Define the route path. Let's be safe and make sure there is no
    // empty middleware being added to the route.
    if (middleware.length !== 0)
      verbFunc.call (self._router, currPath, middleware);
  }

  /**
   * Process the <use> statement in the router. If the path is defined, then the
   * handlers are bound to the path. If there is no path, then the handlers are
   * used for all paths.
   *
   * @param path
   * @param handlers
   */
  function processUse (path, handlers) {
    winston.log ('debug', 'processing use %s', path);
    self._router.use (path, handlers);
  }

  /**
   * Registers a parameters with the router. The parameter starts with a colon (:).
   *
   * @param param
   * @param opts
   */
  function processParam (param, opts) {
    winston.log ('debug', 'processing parameter %s', param);
    var rawParam = param.substring (1);

    if (opts.action) {
      // The parameter invokes an operation on the controller.
      var controller = resolveController (opts.action);
      self._router.param (rawParam, controller.invoke ());
    }
    else if (opts.property) {
      // The parameter is just stored as a property on the request. We can just provide our
      // own function to handle this operation. There is no need to invoke a method on a
      // controller.
      self._router.param (rawParam, function (req, res, next, value) {
        req[opts.property] = value;
        next ();
      });
    }
    else {
      throw new Error ('Invalid parameter specification (' + param + ')');
    }
  }

  if (!currPath)
    currPath = this._basePath;

  var specType = typeof spec;

  if (Array.isArray (spec) || specType === 'function') {
    // The specification is either an array of middleware, or a previously defined
    // router imported into this specification. An example of the latter case is
    // someone importing a router from an existing blueprint module.
    this._router.use (currPath, spec);
  }
  else if (specType === 'object') {
    // The specification is a text-based key-value pair. We need to read each key
    // in the specification and build the described router.
    for (var key in spec) {
      if (!spec.hasOwnProperty (key))
        continue;

      if (key === 'use') {
        // This is a use specification, but without a path because it is associated
        // with the router. So, process the use specification without specifying a path.
        processUse (currPath, spec[key]);
      }
      else {
        // The first letter of the key is a hint at how to process this key's value.
        switch (key[0]) {
          case '/':
            var innerPath = currPath + (currPath.endsWith ('/') ? key.slice (1) : key);
            this.addSpecification (spec[key], innerPath);
            break;

          case ':':
            processParam (key, spec[key]);
            break;

          default:
            processHttpVerb (key, currPath, spec[key]);
        }
      }
    }
  }
  else {
    throw Error ('Specification must be a object, router function, or an array of router functions');
  }

  return this;
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
      
      if (typeof value === 'function')
        this._router.use (value);
      else
        this.addRouters (value);
    }
  }

  return this;
};

module.exports = exports = RouterBuilder;