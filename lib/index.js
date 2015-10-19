'use strict';

var util   = require ('util')
  , extend = require ('extend')
  ;

var BaseController    = require ('./BaseController')
  , Application       = require ('./Application')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework         = require ('./Framework')
  ;

exports.BaseController = BaseController;
exports.ApplicationModule = ApplicationModule;

// Make sure Blueprint has been instantiated in the main process. This instance
// is used by the current application, and its dependencies to ensure operate in
// the same address space without version problems.
var framework = Framework ();

/**
 * Get the application for the module. If the application has not been
 * initialized, then an exception is thrown.
 */
Object.defineProperty (exports, 'app', {
  get : function () { return framework.app; }
});

/**
 * Get the Schema definition for models.
 */
Object.defineProperty (exports, 'Schema', {
  get : function () { return framework.app.database.Schema; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'messaging', {
  get : function () { return framework.messaging; }
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
  return framework.app.database.registerModel (name, schema);
}

/**
 * Factory method for creating an Blueprint.js application. The application is installed
 * in the main module.
 *
 * @param appPath
 * @constructor
 */
exports.Application = function (appPath) {
  if (framework.hasApplication ())
    throw new Error ('Application is already initialized');

  // Create a new application and install it.
  var app = new Application (appPath);
  framework.app = app;

  // Initialize the application.
  app.init ();

  return app;
};

/**
 * Register for an event from the framework. The callback is registered with
 * the event on the default messenger.
 *
 * @param ev
 * @param cb
 */
exports.on = function (ev, cb) {
  framework.messaging.getMessenger ().on (ev, cb);
};

/**
 * Emit an event over the framework.
 */
exports.emit = function () {
  var messenger = framework.messaging.getMessenger ();
  var emit = messenger.emit;

  emit.apply (messenger, arguments);
};

/**
 * Destroy the framework. Once this method returns, the Xpression
 * module is no longer usable.
 */
exports.destroy = function () {
  framework.destroy ();
}