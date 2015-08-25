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

// Locate the masterprint for the application. The masterprint is the top-level
// Blueprint module for the application that is using another Blueprint application
// as a library module. We need to masterprint when registering the database models
// with Mongoose. Without the masterprint, the database models are registered on
// the connection in this loaded module, not the top-level application.

var parent = module;

while (parent.parent !== null)
  parent = parent.parent;

var masterprint = parent.require ('blueprint');

/**
 * Resolve the application path for a module.
 *
 * @param callback
 * @returns {*}
 */
function resolveApplicationPath (callback) {
  for (var i = 0; i < module.paths.length; ++ i) {
    var absPath = path.resolve (module.paths[i], '../app');

    try {
      var stat = fs.lstatSync (absPath);

      if (stat && stat.isDirectory ())
        return absPath;
    }
    catch (ex) {
      // Do nothing...
    }
  }

  return false;
}

Object.defineProperty (exports, 'env', {
  get : function () { return app.env; }
});

Object.defineProperty (exports, 'models', {
  get : function () { return app.models; }
});

Object.defineProperty (exports, 'config', {
  get : function () { return app.config; }
});

Object.defineProperty (exports, 'controllers', {
  get : function () { return app.controllers; }
});

Object.defineProperty (exports, 'Schema', {
  get : function () { return masterprint.ApplicationModule.Schema; }
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
  return masterprint.app.database.registerModel (name, schema);
}

// Singleton application for the module. Resolve the location of the
// application directory, and initialize the application to the resolved
// location.
var appPath = resolveApplicationPath ();

if (!appPath)
  throw Error ('Cannot resolve application path');

var app = new Application (appPath);
exports.app = app;

// Initialize the application.
app.init ();
