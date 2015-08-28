var util = require ('util')
  , path = require ('path')
  , fs   = require ('fs')
  ;

var BaseController    = require ('./BaseController')
  , Application       = require ('./Application')
  , ApplicationModule = require ('./ApplicationModule')
  ;

exports.BaseController = BaseController;
exports.ApplicationModule = ApplicationModule;

// Singleton application for the module. Resolve the location of the application
// directory, and initialize the application to the resolved location.
Object.defineProperty (exports, 'Schema', {
  get : function () { return process.mainModule.app.Schema; }
});

/**
 * Get the application for the module. If the application has not been
 * initialized, then an exception is thrown.
 */
Object.defineProperty (exports, 'app', {
  get : function () {
    if (!process.mainModule.app)
      throw new Error ('Application is not initialized; must all Application(appPath) first');

    return process.mainModule.app;
  }
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
  return process.mainModule.app.database.registerModel (name, schema);
}

/**
 * Factory method for creating an Blueprint.js application. The application is installed
 * in the main module.
 *
 * @param appPath
 * @constructor
 */
exports.Application = function (appPath) {
  var app = process.mainModule.blueprint;

  if (app)
    throw new Error ('Application is already initialized');

  // Create a new application, initialize the application, and return the
  // application to the caller.
  app = new Application (appPath);
  app.init ();

  // Install the application in the main module. We define it as a property
  // so that it cannot be set.
  Object.defineProperty (process.mainModule, 'blueprint', {
    get : function () { return app; }
  });

  return app;
};
