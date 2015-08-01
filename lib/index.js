var util = require ('util')
  ;

var BaseController = require ('./BaseController')
  , Application    = require ('./Application')
  ;

// Singleton application for the package.
var app;

exports.BaseController = BaseController;

exports.Application = function (appPath) {
  if (app) return app;

  // Create a new application object, and export the models loaded
  // by the application.
  app = new Application (appPath);
  exports.models = app.models;

  // Return the application singleton to the client.
  return app;
};

exports.controller = function (controller, base) {
  base = base || BaseController;

  util.inherits (controller, base);
};
