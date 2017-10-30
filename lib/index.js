'use strict';

const _            = require ('underscore')
  , util           = require ('util')
  , async          = require ('async')
  , pluralize      = require ('pluralize')
  , objectPath     = require ('object-path')
  , Env            = require ('./Environment')
  , BaseController = require ('./BaseController')
  , Framework      = require ('./Framework')
  , RouterBuilder  = require ('./RouterBuilder')
  ;

/**
 * Resolve a Blueprint resource. The resource can be located in the application, or
 * it can be located inside a module.
 *
 * [scheme:]//[module]@[name]
 *
 * Ex.
 *
 * router://@onehilltech/gatekeeper:v1
 *
 * @param uri
 */
function resolve (uri) {
  const schemeAndResource = uri.split ('://');

  if (schemeAndResource.length !== 2)
    throw new Error ('Missing scheme');

  const scheme = schemeAndResource[0];
  const rc = schemeAndResource[1];

  const moduleAndName = rc.split (':');
  var moduleName = null;
  var name = null;

  if (moduleAndName.length === 1) {
    name = moduleAndName[0];
  }
  else if (moduleAndName.length === 2) {
    moduleName = moduleAndName[0];
    name = moduleAndName[1];
  }
  else {
    throw new Error ('Malformed uri');
  }

  // The plural of the scheme is the name of the resource manager.
  const plural = pluralize (scheme);

  var app = Framework.app;
  var module = moduleName ?  app.modules[moduleName] : app;

  if (!module)
    throw new Error ('module does not exist: ' + moduleName);

  var resources = module[plural];

  if (!resources)
    throw new Error ('unsupported resource type: ' + scheme);

  var resource = objectPath.get (resources, name);

  if (!resource)
    throw new Error ('resource does not exist: ' + name);

  if (scheme === 'router' && !_.isFunction (resource)) {
    // The router resource is a directory. This means we are loading many routers
    // with as this resource. We therefore need to build the router by composite
    // router the collection of routers.
    resource = new RouterBuilder (app, '/').addRouters (resource).getRouter ();
  }

  return resource;
}

var exports = module.exports = resolve;
Object.assign (exports, Framework);

/**
 * Get the application for the module. If the application has not been
 * initialized, then an exception is thrown.
 */
Object.defineProperty (exports, 'app', {
  get: function () { return Framework.app; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'messaging', {
  get: function () { return Framework.messaging; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'version', {
  get: function () { return Framework.version; }
});

exports.BaseController = exports.Controller = BaseController;
exports.ResourceController = require ('./ResourceController');
exports.Policy = require ('./Policy');
exports.http = require ('./http');
exports.errors = require ('./errors');
exports.barrier = require ('./Barrier');
exports.require = require ('./require');

// Make sure Blueprint has been instantiated in the main process. This instance
// is used by the current application, and its dependencies to ensure operate in
// the same address space without version problems.

Object.defineProperty (exports, 'testing', {
  get: function () { return require ('./testing'); }
});

/**
 * Get the current Node.js environment. The default Node.js environment is development.
 */
Object.defineProperty (exports, 'env', {
  get: function () { return Env.name }
});

/**
 * Helper method to define different controllers. This method ensures the controller
 * is an instance of BaseController.
 */
exports.controller = function (controller, base) {
  base = base || BaseController;
  util.inherits (controller, base);
};

exports.Listener = require ('./listener');
