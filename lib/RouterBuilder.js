var express = require ('express')
  , winston = require ('winston')
  , path    = require ('path')
  , util    = require ('util')
  ;

// The solution for endWith() is adopted from the following solution on
// StackOverflow:
//
//  http://stackoverflow.com/a/2548133/2245732

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}
const ROUTER_SUFFIX = 'Router';

function RouterBuilder (routerPath, controllers, currPath) {
  this._routerPath = routerPath;
  this._controllers = controllers;
  this._currPath = currPath || '/';

  this._router = express.Router ();
}

RouterBuilder.prototype.build = function (routers) {
  for (var key in routers) {
    if (routers.hasOwnProperty(key)) {
      if (key.endsWith (ROUTER_SUFFIX))
        this.addRouter (key, routers[key]);
      else
        this.addPath (key, routers[key]);
    }
  }

  return this;
};

RouterBuilder.prototype.addRouter = function (name, routes) {
  winston.log ('info', 'adding router %s', name);
  var self = this;

  function resolveController (parts) {
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

    return {
      obj: controller,
      method : method,
      invoke : function () {
        return this.method.call (this.obj);
      }
    };
  }

  function processRoute (path, route) {
    for (var verb in route) {
      var opts = route[verb];
      var verbFunc = self._router[verb.toLowerCase ()];

      if (!verbFunc)
        throw new Error (util.format ('%s is not a valid http verb', verb));

      if (opts.action) {
        // Resolve the controller and its method. The format of the action is
        // 'controller@method'.
        var action = opts.action;
        var actionParts = action.split ('@');

        if (actionParts.length != 2)
          throw new Error (util.format ('invalid action format [%s]', action));

        var controller = resolveController (actionParts);
        verbFunc.call (self._router, path, controller.invoke ());
      }
      else if (opts.view) {
        // Render the view.
        verbFunc.call (self._router, path, function (req, res) {
          return res.render (opts.view);
        });
      }
      else {
        winston.error ('[%s]: %s %s must define an action or view property', name, verb, path);
      }
    }
  }

  for (var route in routes) {
    if (routes.hasOwnProperty (route)) {
      winston.log ('debug', 'building route: %s', route);
      processRoute (route, routes[route])
    }
  }
  return this;
};

RouterBuilder.prototype.addPath = function (basePath, router) {
  var targetPath = path.join (this._currPath, basePath);
  winston.log ('info', 'building router for path %s', targetPath);

  var builder = new RouterBuilder (this._routerPath, this._controllers, targetPath);
  builder.build (router);

  this._router.use (targetPath, builder.getRouter ());

  return this;
};

RouterBuilder.prototype.getRouter = function () {
  return this._router;
};

module.exports = exports = RouterBuilder;