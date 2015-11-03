var express = require ('express')
  , winston = require ('winston')
  , path    = require ('path')
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

var ROUTER_SUFFIX = 'Router';

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
function RouterBuilder (routerPath, controllers, currPath) {
  this._routerPath = routerPath;
  this._controllers = controllers;
  this._currPath = currPath || '/';

  this._router = express.Router ();
}

/**
 * Add a set of routers to the router builder.
 *
 * @param specs
 * @returns {RouterBuilder}
 */
RouterBuilder.prototype.addRouters = function (routers) {
  for (var key in routers) {
    if (routers.hasOwnProperty (key)) {
      if (key.endsWith (ROUTER_SUFFIX))
        this._router.use (routers[key]);
      else
        this.addPath (key, routers[key]);
    }
  }

  return this;
};

/**
 * Add a set of routes to the router.
 *
 * @param routes
 * @returns {RouterBuilder}
 */
RouterBuilder.prototype.addRoutes = function (routes) {
  var self = this;

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
   * @param path
   * @param route
   */
  function processRoute (path, route) {
    winston.log ('debug', 'processing route %s', path);

    for (var verb in route) {
      var opts = route[verb];
      var verbFunc = self._router[verb.toLowerCase ()];

      if (!verbFunc)
        throw new Error (util.format ('%s is not a valid http verb', verb));

      if (verb === 'use') {
        // This is a special case since the options for the <use> verb is
        // a single handler, or an array of handlers.
        processUse (path, opts);
      }
      else {
        if (opts.action) {
          // Resolve the controller and its method. The format of the action is
          // 'controller@method'.
          var controller = resolveController (opts.action);
          verbFunc.call (self._router, path, controller.invoke ());
        }
        else if (opts.view) {
          // Use a generic callback to render the view. Make sure we save a reference
          // to the target view since the opts variable will change during the next
          // iteration.
          var view = opts.view;

          verbFunc.call (self._router, path, function (req, res) {
            return res.render (view);
          });
        }
        else {
          winston.log ('error', '[%s]: %s %s must define an action or view property', name, verb, path);
        }
      }
    }
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
    if (path)
      self._router.use (path, handlers);
    else
      self._router.use (handlers);
  }

  /**
   * Registers a parameters with the router. The parameter starts with a colon (:).
   *
   * @param param
   * @param action
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

  for (var key in routes) {
    if (routes.hasOwnProperty (key)) {
      if (key === 'use') {
        // This is a use specification, but without a path. So, process the use
        // specification without specifying a path.
        processUse (null, routes[key]);
      }
      else {
        // The first letter of the key is a hint at how to process this
        // key's value.
        switch (key[0]) {
          case '/':
            processRoute (key, routes[key]);
            break;

          case ':':
            processParam (key, routes[key]);
            break;
        }
      }
    }
  }
  return this;
};

/**
 * Add a path to the router.
 *
 * @param basePath
 * @param router
 * @returns {RouterBuilder}
 */
RouterBuilder.prototype.addPath = function (basePath, router) {
  var targetPath = path.join (this._currPath, basePath);
  winston.log ('debug', 'building router for path %s', targetPath);

  var builder = new RouterBuilder (this._routerPath, this._controllers, targetPath);
  builder.addRouters (router);

  this._router.use (targetPath, builder.getRouter ());

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

module.exports = exports = RouterBuilder;