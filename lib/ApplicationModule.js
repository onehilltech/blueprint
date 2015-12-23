'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Database      = require ('./Database')
  , Loader        = require ('./Loader')
  , Framework     = require ('./Framework')
  ;

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules. This class only works if
 * blueprint.Application() has been called for the top-level project.
 *
 * @param appPath
 * @constructor
 */
function ApplicationModule (appPath) {
  this._listeners = undefined;
  this._controllers = undefined;
  this._models = undefined;
  this._routers = undefined;

  // Resolve the complete application path.
  this.appPath = path.resolve (appPath);

  // Load the application configuration.
  var appConfigPath = path.join (appPath, 'configs', 'app.config.js');
  var appConfig = require (appConfigPath);
  this.name = appConfig.name;

  // Force auto-loading of the listeners.
  this.listeners;
}

/**
 * Get the models defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('models', function () {
  if (this._models)
    return this._models;

  // Load all the models into memory.
  winston.log ('debug', 'loading application models into memory');

  Framework().messaging.emit ('app.models.loading', this);
  this._models = Loader.loadModels (path.join (this.appPath, 'models'));
  Framework().messaging.emit ('app.models.loaded', this);

  return this._models;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  if (this._controllers)
    return this._controllers;

  winston.log ('debug', 'loading controllers into memory');

  Framework().messaging.emit ('app.controllers.loading', this);
  this._controllers = Loader.loadControllers (path.join (this.appPath, 'controllers'));
  Framework().messaging.emit ('app.controllers.loaded', this);

  return this._controllers;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  if (this._routers)
    return this._routers;

  var routerPath = path.join (this.appPath, 'routers');
  winston.log ('debug', 'loading routers into memory');

  Framework().messaging.emit ('app.routers.loading', this);
  this._routers = Loader.loadRouters (routerPath, this.controllers)
  Framework().messaging.emit ('app.routers.loaded', this);

  return this._routers;
});

/**
 * Get the listener for the application. If the listeners are not loaded, then load
 * the listeners in the application directory.
 */
ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  if (this._listeners)
    return this._listeners;

  var listenersPath = path.join (this.appPath, 'listeners');
  winston.log ('debug', 'loading listeners into memory');

  Framework().messaging.emit ('app.listeners.loading', this);
  this._listeners = Loader.loadListeners (listenersPath, Framework().messaging);
  Framework().messaging.emit ('app.listeners.loaded', this);

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
  var fullpath = path.resolve (this.appPath, 'resources', filename);
  winston.log ('debug', 'reading resource: %s', fullpath);

  if (callback)
    return fs.readFile (fullpath, callback);
  else
    return fs.readFileSync (fullpath);
};

/**
 * Test if the application module has any views.
 */
ApplicationModule.prototype.getSupportsViews = function () {
  var viewPath = this.getViewsPath ();

  try {
    var stat = fs.statSync (viewPath);
    return stat.isDirectory ();
  }
  catch (ex) {
    return false;
  }
};

/**
 * Get the path of the views. This does not test if the path is actually
 * part of the module. To perform such a test, see getSupportsViews().
 */
ApplicationModule.prototype.getViewsPath = function () {
  return path.resolve (this.appPath, 'views');
};

module.exports = ApplicationModule;

