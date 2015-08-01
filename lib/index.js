var util = require ('util')
  ;

var BaseController = require ('./BaseController')
  , Application    = require ('./Application')
  ;

// Singleton application for the package.
var app;

exports.BaseController = BaseController;

Object.defineProperty (exports, 'env', {
  get : function () { return app.env }
});

Object.defineProperty (exports, 'models', {
  get : function () { return app.models }
});

Object.defineProperty (exports, 'config', {
  get : function () { return app.config }
});

exports.Application = function (appPath) {
  if (app)
    return app;

  // Create a new application object, and export the models loaded
  // by the application.
  app = new Application (appPath);
  app.init ();

  return app;
};

// Helper method to define different controllers. This method ensures the controller
// is an instance of BaseController.
exports.controller = function (controller, base) {
  base = base || BaseController;

  util.inherits (controller, base);
};

