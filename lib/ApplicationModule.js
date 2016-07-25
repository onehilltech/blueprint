'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Database      = require ('./Database')
  , Framework     = require ('./Framework')
  , PolicyManager = require ('./PolicyManager')
  , ModelManager  = require ('./ModelManager')
  , ControllerManager = require ('./ControllerManager')
  , ListenerManager = require ('./ListenerManager')
  , RouterManager = require ('./RouterManager')
  ;

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules. This class only works if
 * blueprint.Application() has been called for the top-level project.
 *
 * @param name
 * @param modulePath
 * @constructor
 */
function ApplicationModule (name, modulePath) {
  if (!name)
    throw Error ('Must provide a name for the module');

  this._listenerManager = undefined;
  this._controllerManager = undefined;
  this._modelManager = undefined;
  this._routerManager = undefined;
  this._policyManager = undefined;

  // Resolve the complete application path.
  this.appPath = path.resolve (modulePath);
  this.moduleName = name;

  // Force auto-loading of the listeners.
  this.listeners;
}

/**
 * Get the models defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('models', function () {
  if (this._modelManager)
    return this._modelManager.models;

  this._modelManager = new ModelManager ();
  winston.log ('info', 'loading application models');

  Framework ().messaging.emit ('app.models.loading', this);
  this._modelManager.load (path.join (this.appPath, 'models'));
  Framework ().messaging.emit ('app.models.loaded', this);

  return this._modelManager.models;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  if (this._controllerManager)
    return this._controllerManager.controllers;

  winston.log ('debug', 'loading controllers into memory');
  this._controllerManager = new ControllerManager ();

  Framework().messaging.emit ('app.controllers.loading', this);
  this._controllerManager.load (path.join (this.appPath, 'controllers'));
  Framework().messaging.emit ('app.controllers.loaded', this);

  return this._controllerManager.controllers;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  if (this._routerManager)
    return this._routerManager.routers;

  winston.log ('debug', 'loading routers into memory');

  Framework().messaging.emit ('app.routers.loading', this);
  this._routerManager = new RouterManager (this.controllers);
  this._routerManager.load (path.join (this.appPath, 'routers'));
  Framework().messaging.emit ('app.routers.loaded', this);

  return this._routerManager.routers;
});

/**
 * Get the listener for the application. If the listeners are not loaded, then load
 * the listeners in the application directory.
 */
ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  if (this._listenerManager)
    return this._listenerManager.listeners;

  winston.log ('debug', 'loading listeners into memory');

  Framework().messaging.emit ('app.listeners.loading', this);
  this._listenerManager = new ListenerManager (Framework().messaging);
  this._listenerManager.load (path.join (this.appPath, 'listeners'));
  Framework().messaging.emit ('app.listeners.loaded', this);

  return this._listenerManager.listeners;
});

/**
 * Get the policies for the application model.
 */
ApplicationModule.prototype.__defineGetter__ ('policies', function () {
  if (this._policyManager)
    return this._policyManager.policies;

  this._policyManager = new PolicyManager ();
  this._policyManager.load (path.join (this.appPath, 'policies'));

  return this._policyManager.policies;
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

