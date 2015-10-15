'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , util    = require ('util')
  ;

var Server            = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , Database          = require ('./Database')
  , ApplicationModule = require ('./ApplicationModule')
  , Messaging         = require ('./Messaging')
  ;

/**
 * @class Application
 *
 * The main Blueprint.js application.
 *
 * @param appPath
 * @constructor
 */
function Application (appPath) {
  ApplicationModule.call (this, appPath);
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function () {
  winston.log ('info', 'application path: %s', this._appPath);

  // First, load all the listeners. This allows the listeners to receive
  // events about the initialization process.
  this.listeners;

  // Load the configuration.
  var configPath = path.join (this._appPath, 'configs');
  this._config = Configuration (configPath, this.env);

  // Initialize the database object, if a configuration exists. If we
  // have a database configuration, then we can have models.
  if (this._config.database) {
    this._db = new Database (this._config['database']);
    this._db.setMessenger (this._messenger);

    // Force loading of the models.
    this.models;
  }

  // Make the server object.
  this._server = new Server (this._appPath, this._config['server']);

  // Make the router for the application. Then, install the router in the
  // server object.
  var routersPath = path.resolve (this._appPath, 'routers');
  var routerBuilder = new RouterBuilder (routersPath, this.controllers);

  this._router = routerBuilder.addRouters (this.routers).getRouter ();
  this._server.setMainRouter (this._router);

  // Notify all listeners the application is initialized.
  this._messenger.emit ('app.init', this);
};

/**
 * Start the application. This method connects to the database, creates a
 * new server, and starts listening for incoming messages.
 *
 * @param callback
 */
Application.prototype.start = function (callback) {
  var self = this;

  function onConnected (err) {
    if (err)
      return callback (err);

    self._server.listen (function () {
      self._messenger.emit ('app.start', self);
      process.nextTick (callback);
    });
  }

  // If there is a database, connect to the database. Otherwise, proceed
  // with acting as if we are connected to an imaginary database.
  if (this._db)
    this._db.connect (onConnected);
  else
    onConnected (null);
};

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('database', function () {
  if (!this._db)
    throw new Error ('application did not configure database');

  return this._db;
});

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('config', function () {
  return this._config;
});

/**
 * Get the application server.
 */
Application.prototype.__defineGetter__ ('server', function () {
  if (!this._server)
    throw new Error ('application did not configure server');

  return this._server;
});

module.exports = exports = Application;
