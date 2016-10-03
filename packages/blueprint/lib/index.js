'use strict';

var util = require ('util')
  ;

var BaseController = require ('./BaseController')
  , Application = require ('./Application')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework = require ('./Framework')
  , Env = require ('./Environment')
  , RouterBuilder = require ('./RouterBuilder')
  , Policy = require ('./Policy')
  , ModuleRouter = require ('./ModuleRouter')
  ;

var testing = null;

exports.BaseController = BaseController;
exports.ApplicationModule = ApplicationModule;
exports.RouterBuilder = RouterBuilder;
exports.Policy = Policy;
exports.ModuleRouter = ModuleRouter;

// Make sure Blueprint has been instantiated in the main process. This instance
// is used by the current application, and its dependencies to ensure operate in
// the same address space without version problems.

/**
 * Get the application for the module. If the application has not been
 * initialized, then an exception is thrown.
 */
Object.defineProperty (exports, 'app', {
  get: function () { return Framework ().app; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'messaging', {
  get: function () { return Framework ().messaging; }
});

Object.defineProperty (exports, 'testing', {
  get: function () {
    if (testing)
      return testing;

    testing = require ('./testing');
    return testing;
  }
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

/**
 * Factory method for creating an Blueprint.js application. The application is installed
 * in the main module.
 *
 * @param appPath
 * @param callback
 *
 * @constructor
 */
exports.Application = function (appPath, callback) {
  if (Framework ().hasApplication ()) {
    if (appPath !== Framework ().app.appPath)
      return callback (new Error (util.format ('Application is already initialized [path=%s]', appPath)));

    return callback (null, Framework().app)
  }

  var app = new Application (appPath);
  Framework ().app = app;

  app.init (callback);

  return app;
};

/**
 * Destroy the Framework ().
 */
exports.destroy = function (callback) {
  var framework = Framework ();

  if (framework !== undefined) {
    framework.releaseApplication ();
    Framework.destroy ();
  }

  if (callback)
    return callback (null);
};

exports.errors = require ('./errors');
