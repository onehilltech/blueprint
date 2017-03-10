'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , fs      = require ('fs')
  , async   = require ('async')
  , util    = require ('util')
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
  this._is_init = false;
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
 * Initialize the application module.
 *
 * @param callback
 * @returns {*}
 */
ApplicationModule.prototype.init = function (callback) {
  if (this._is_init)
    return callback (null, this);

  winston.log ('debug', 'initializing module: %s', this._appPath);

  async.waterfall ([
    async.constant (this),
    
    function (module, callback) {
      var initHookFile = path.resolve (module._appPath, 'hooks/module.init.js');

      fs.stat (initHookFile, function (err, stat) {
        if (err && err.code === 'ENOENT') return callback (null, module);
        if (err) return callback (err);
        if (!stat.isFile ()) return callback (null, module);

        // Load the initialization hook, forcing the file to execute.
        module.initState = require (initHookFile);

        return callback (null, module);
      });
    },

    loadInto (this.modelManager, 'models'),
    loadInto (this.policyManager, 'policies'),
    loadInto (this.listenerManager, 'listeners'),
    loadInto (this.controllerManager, 'controllers'),
    loadInto (this.routerManager, 'routers'),
    loadInto (this.validatorManager, 'validators'),
    loadInto (this.sanitizerManager, 'sanitizers'),

    function (module, callback) {
      // Mark the module as initialized, and notify all listeners.
      module._is_init = true;
      Framework ().messaging.emit ('module.init', module);

      return callback (null, module);
    }
  ], callback);

  function loadInto (manager, location) {
    return function (module, callback) {
      try {
        var rcPath = path.join (module._appPath, location);

        manager.load (rcPath, function (err) {
          if (err && err.code === 'ENOENT') err = null;
          return callback (err, module);
        });
      }
      catch (ex) {
        return callback (new Error (util.format ('Failed to load resources in %s [%s]', location, ex.message)));
      }
    }
  }
};

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
  return path.resolve (this._appPath, 'views');
};

module.exports = ApplicationModule;
