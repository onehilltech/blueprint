'use strict';

var path    = require ('path')
  , fs      = require ('fs')
  , async   = require ('async')
  , util    = require ('util')
  , debug   = require ('debug') ('blueprint:app-module')
  ;

var RouterBuilder   = require ('./RouterBuilder')
  , Framework       = require ('./Framework')
  , ListenerManager = require ('./ListenerManager')
  , RouterManager   = require ('./RouterManager')
  , ResourceManager = require ('./ResourceManager')
  ;

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules. This class only works if
 * blueprint.Application() has been called for the top-level project.
 *
 * @param appPath         Location of the application module
 * @constructor
 */
function ApplicationModule (appPath) {
  this._isModuleInit = false;
  this._appPath = appPath;

  this.listenerManager = new ListenerManager (Framework ().messaging);
  this.policyManager = new ResourceManager ('policies');
  this.modelManager = new ResourceManager ('models');

  this.controllerManager = new ResourceManager ('controllers', {
    resolve: function (Controller) { return new Controller (); },
    filter: /(.+Controller)\.js$/
  });

  this.routerManager = new RouterManager (this);
  this.validatorManager = new ResourceManager ('validators', {recursive: false});
  this.sanitizerManager = new ResourceManager ('sanitizers', {recursive: false});
}

/**
 * Create an application module from the specified path. The returned application
 * module will be initialized.
 *
 * @param modulePath        Path of the application module
 * @param callback
 */
ApplicationModule.createFromPath = function (modulePath, callback) {
  var appModule = new ApplicationModule (modulePath);
  appModule.init (callback);
};

function loadInto (manager, location) {
  return function (callback) {
    try {
      var rcPath = path.join (this._appPath, location);
      debug ('loading resources from ' + rcPath);

      manager.load (rcPath, function (err) {
        if (err && err.code === 'ENOENT') {
          debug (rcPath + ' does not exist');
          err = null;
        }

        return callback (err);
      });
    }
    catch (ex) {
      return callback (new Error (util.format ('Failed to load resources in %s [%s]', location, ex.message)));
    }
  }.bind (this);
}

/**
 * Initialize the application module.
 *
 * @param callback
 * @returns {*}
 */
ApplicationModule.prototype.init = function (callback) {
  if (this._isModuleInit)
    return callback (null, this);

  debug ('initializing module ' + this._appPath);

  async.waterfall ([
    function (callback) {
      var initHookFile = path.resolve (this._appPath, 'hooks/module.init.js');

      fs.stat (initHookFile, function (err, stat) {
        if (err && err.code === 'ENOENT')
          return callback (null);

        if (err)
          return callback (err);

        if (!stat.isFile ())
          return callback (null);

        // Load the initialization hook, forcing the file to execute.
        this.initState = require (initHookFile);

        return callback (null);
      }.bind (this));
    }.bind (this),

    loadInto.call (this, this.modelManager, 'models'),
    loadInto.call (this, this.policyManager, 'policies'),
    loadInto.call (this, this.listenerManager, 'listeners'),
    loadInto.call (this, this.controllerManager, 'controllers'),
    loadInto.call (this, this.routerManager, 'routers'),
    loadInto.call (this, this.validatorManager, 'validators'),
    loadInto.call (this, this.sanitizerManager, 'sanitizers'),

    function (callback) {
      // Mark the module as initialized.
      this._isModuleInit = true;

      // Notify all parties that are listening.
      Framework ().messaging.emit ('module.init', this);

      return callback (null, this);
    }.bind (this)
  ], callback);
};

ApplicationModule.prototype.__defineGetter__ ('isInit', function () {
  return this._isModuleInit;
});

ApplicationModule.prototype.__defineGetter__ ('appPath', function () {
  return this._appPath;
});

ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  return this.listenerManager.resources;
});

ApplicationModule.prototype.__defineGetter__ ('policies', function () {
  return this.policyManager.resources;
});

ApplicationModule.prototype.__defineGetter__ ('models', function () {
  return this.modelManager.resources;
});

ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  return this.controllerManager.resources;
});

ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  return this.routerManager.routers;
});

ApplicationModule.prototype.__defineGetter__ ('validators', function () {
  return this.validatorManager.resources;
});

ApplicationModule.prototype.__defineGetter__ ('sanitizers', function () {
  return this.sanitizerManager.resources;
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
  debug ('reading resource ' + fullpath);

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
  return path.resolve (this._appPath, 'views');
};

module.exports = ApplicationModule;
