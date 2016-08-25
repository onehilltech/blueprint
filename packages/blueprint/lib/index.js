'use strict';

var util = require ('util')
  ;

var BaseController     = require ('./BaseController')
  , ResourceController = require ('./ResourceController')
  , GridFSController   = require ('./GridFSController')
  , Application        = require ('./Application')
  , ApplicationModule  = require ('./ApplicationModule')
  , Framework          = require ('./Framework')
  , Env                = require ('./Environment')
  , RouterBuilder      = require ('./RouterBuilder')
  , Policy             = require ('./Policy')
  , ModuleRouter       = require ('./ModuleRouter')
  ;

exports.BaseController = BaseController;
exports.ResourceController = ResourceController;
exports.GridFSController = GridFSController;
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
  get : function () { return Framework ().app; }
});

/**
 * Get the Schema definition for models.
 */
Object.defineProperty (exports, 'Schema', {
  get : function () { return Framework ().app.database.Schema; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'messaging', {
  get : function () { return Framework ().messaging; }
});

/**
 * Get the current Node.js environment. The default Node.js environment is development.
 */
Object.defineProperty (exports, 'env', {
  get : function () { return Env.name }
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
 * Register a model with the application database.
 *
 * @param name
 * @param schema
 */
exports.model = function (name, schema) {
  return Framework ().app.database.registerModel (name, schema);
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

/**
 * Include an application model in the main application.
 *
 * @param moduleName
 * @param appModulePath
 * @param callback
 */
exports.include = function (moduleName, appModulePath, callback) {
  Framework().app.addModule (moduleName, appModulePath, callback);
};

exports.errors = require ('./errors');
