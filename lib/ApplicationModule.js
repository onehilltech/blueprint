'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  , async   = require ('async')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Database      = require ('./Database')
  , Messaging     = require ('./Messaging')
  , Loader        = require ('./Loader')
  ;

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules.
 *
 * @param appPath
 * @constructor
 */
function ApplicationModule (appPath) {
  // Initialize the application module.
  this._appPath = path.resolve (appPath);

  this.messaging = new Messaging ();
  this.defaultMessenger = this.messaging.getMessenger ();

  this._listeners = undefined;
  this._controllers = undefined;
  this._models = undefined;
  this._routers = undefined;
}

/**
 * Get the models defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('models', function () {
  if (this._models)
    return this._models;

  // Load all the models into memory.
  winston.log ('debug', 'loading application models into memory');
  this.defaultMessenger.emit ('appmodule.models.loading', this);

  this._models = Loader.loadModels (path.join (this._appPath, 'models'));

  this.defaultMessenger.emit ('appmodule.models.loaded', this);
  return this._models;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  if (this._controllers)
    return this._controllers;

  winston.log ('debug', 'loading controllers into memory');
  this.defaultMessenger.emit ('appmodule.controllers.loading', this);

  // Load all the controllers into memory.
  this._controllers = Loader.loadControllers (path.join (this._appPath, 'controllers'));

  this.defaultMessenger.emit ('appmodule.controllers.loaded', this);
  return this._controllers;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  if (this._routers)
    return this._routers;

  // Load all the routers into memory.
  winston.log ('debug', 'loading routers into memory');
  this.defaultMessenger.emit ('appmodule.routers.loading', this);

  var routerPath = path.join (this._appPath, 'routers');
  this._routers = Loader.loadRouters (routerPath, this.controllers)

  this.defaultMessenger.emit ('appmodule.routers.loaded', this);
  return this._routers;
});

/**
 * Get the listener for the application. If the listeners are not loaded, then load
 * the listeners in the application directory.
 */
ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  if (this._listeners)
    return this._listeners;

  winston.log ('debug', 'loading listeners into memory');
  this.defaultMessenger.emit ('appmodule.listeners.loading', this);

  // Load all the controllers into memory.
  var listenersPath = path.join (this._appPath, 'listeners');
  this._listeners = Loader.loadListeners (listenersPath, this.messaging);

  this.defaultMessenger.emit ('appmodule.listeners.loaded', this);
  return this._listeners;
});

/**
 * Get the current Node.js environment. The default Node.js environment is development.
 */
ApplicationModule.prototype.__defineGetter__ ('env', function () {
  return process.env.NODE_ENV || 'dev';
});

ApplicationModule.prototype.__defineGetter__ ('Schema', function () {
  return Database.Schema;
});

/**
 * Read an application resource. If the callback is undefined, then the data in the
 * resource is returned to the caller.
 *
 * @param filename
 * @param callback
 * @returns {*}
 */
ApplicationModule.prototype.resource = function (filename, callback) {
  var fullpath = path.resolve (this._appPath, 'resources', filename);
  winston.log ('debug', 'reading resource: %s', fullpath);

  if (callback)
    return fs.readFile (fullpath, callback);
  else
    return fs.readFileSync (fullpath);
};

module.exports = exports = ApplicationModule;

