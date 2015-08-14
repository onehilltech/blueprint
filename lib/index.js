var util = require ('util')
  , path = require ('path')
  , fs   = require ('fs')
  ;

var BaseController = require ('./BaseController')
  , Application    = require ('./Application')
  ;

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

exports.BaseController = BaseController;

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
  get : function () { return Application.Schema; }
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
  return app.database.registerModel (name, schema);
}

// Singleton application for the module. Resolve the location of the
// application directory, and initialize the application to the resolved
// location.
var appPath = resolveApplicationPath ();

if (!appPath)
  throw Error ('Cannot resolve application path');

var app = new Application (appPath);
exports.app = app;

app.init ();
