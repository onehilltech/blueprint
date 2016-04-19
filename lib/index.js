'use strict';

var util   = require ('util')
  ;

var BaseController    = require ('./BaseController')
  , Application       = require ('./Application')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework         = require ('./Framework')
  , Env               = require ('./Environment')
  ;

exports.BaseController = BaseController;
exports.ApplicationModule = ApplicationModule;

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
 * @constructor
 */
exports.Application = function (appPath) {
  if (Framework ().hasApplication ()) {
    if (appPath === Framework ().app.appPath)
      return Framework ().app;

    throw new Error (util.format ('Application is already initialized [path=%s]', appPath));
  }

  // Create a new application and install it.
  var app = new Application (appPath);
  Framework ().app = app;

  // Initialize the application.
  app.init ();

  return app;
};

/**
 * Destroy the Framework ().
 */
exports.destroy = function () {
  var framework = Framework ();

  if (framework === undefined)
    return;

  framework.releaseApplication ();
  Framework.destroy ();
};

/**
 * Include an application model in the main application.
 *
 * @param appModulePath
 */
exports.include = function (appModulePath) {
  Framework().app.addModule (appModulePath);
};

var testing;

/**
 * Get the testing module. This module is loaded on demand since it is only valid
 * when we are running tests.
 */
Object.defineProperty (exports, 'testing', {
  get : function () {
    if (testing)
      return testing;

    testing = require ('./testing');
    return testing;
  }
});

