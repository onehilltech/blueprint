'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , fs      = require ('fs')
  , async   = require ('async')
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
 * @param appPath         Location of the application module
 * @param modulesPath     Optional location of ./node_modules
 * @constructor
 */
function ApplicationModule (appPath, modulesPath) {
  this._is_init = false;
  this._appPath = appPath;
  this._modulesPath = modulesPath || path.resolve (appPath, '../node_modules');
  this._modules = {};

  this.listenerManager = new ListenerManager (Framework ().messaging);
  this.policyManager = new PolicyManager ();
  this.modelManager = new ModelManager ();
  this.controllerManager = new ControllerManager ();
  this.routerManager = new RouterManager ();
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

  winston.log ('debug', 'module: %s', this._appPath);

  async.waterfall ([
    async.constant (this),

    // Load the sub-modules for the module.
    function (module, callback) {
      var moduleFileName = path.resolve (module._appPath, 'modules.js');

      fs.stat (moduleFileName, function (err, stat) {
        if (err || !stat.isFile ()) return callback (null, module);

        // Read the module names so we can load the modules into memory.
        var names = require (moduleFileName);

        async.eachSeries (names, function (name, callback) {
          var location = path.resolve (module._modulesPath, name, 'app');

          module.addModule (name, location, callback);
        }, function (err) {
          return callback (err, module);
        });
      });
    },

    // Load the listeners so all parties listening will receive updates
    // about what is going on.
    function (module, callback) {
      var rcPath = path.join (module._appPath, 'listeners');

      module.listenerManager.load (rcPath, function (err) {
        if (err && err.code === 'ENOENT') err = null;
        return callback (err, module);
      });
    },

    // Load the policies from the application module.
    function (module, callback) {
      var rcPath = path.join (module._appPath, 'policies');

      module.policyManager.load (rcPath, function (err) {
        if (err && err.code === 'ENOENT') err = null;
        return callback (err, module);
      });
    },

    // Load the models from the application module.
    function (module, callback) {
      var rcPath = path.join (module._appPath, 'models');

      module.modelManager.load (rcPath, function (err) {
        if (err && err.code === 'ENOENT') err = null;
        return callback (err, module);
      });
    },

    // Load the controllers for the application module.
    function (module, callback) {
      var rcPath = path.join (module._appPath, 'controllers');

      module.controllerManager.load (rcPath, function (err) {
        if (err && err.code === 'ENOENT') err = null;
        return callback (err, module);
      });
    },

    // Load the routers for the application module.
    function (module, callback) {
      var rcPath = path.join (module._appPath, 'routers');

      module.routerManager.load (rcPath, module.controllers, function (err) {
        if (err && err.code === 'ENOENT') err = null;
        return callback (err, module);
      });
    }
  ], function (err, module) {
    if (err) return callback (err);

    // Mark the module as initialized, and notify all listeners.
    module._is_init = true;
    Framework().messaging.emit ('module.init', module);

    return callback (null, module);
  });
};

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param name
 * @param path
 * @param callback
 */
ApplicationModule.prototype.addModule = function (name, path, callback) {
  if (this._modules.hasOwnProperty (name))
    throw new Error (util.format ('duplicate module: %s', name));

  var appModule = new ApplicationModule (path, this._modulesPath);

  async.waterfall ([
    async.constant (this),

    function (app, callback) {
      appModule.init (function (err, module) {
        if (err) return callback (err);

        // Store the module
        app._modules[name] = module;

        return callback (null, app);
      });
    },

    // Import the views from the module into the application.

    function (app, callback) {
      if (!app._server && appModule.getSupportsViews ())
        return callback (null, app);

      app._server.importViews (appModule.getViewsPath (), function (err) {
        return callback (err, app);
      });
    },

    // Merge the listeners

    function (app, callback) {
      app.listenerManager.merge (appModule.listenerManager);
      return callback (null, app);
    },

    // Merge the models

    function (app, callback) {
      app.modelManager.merge (appModule.modelManager);
      return callback (null, app);
    },

    // Merge the policies

    function (app, callback) {
      app.policyManager.merge (appModule.policyManager);
      return callback (null, app);
    }
  ], callback);
};

ApplicationModule.prototype.__defineGetter__ ('appPath', function () {
  return this._appPath;
});

ApplicationModule.prototype.__defineGetter__ ('modules', function () {
  return this._modules;
});

ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  return this.listenerManager.listeners;
});

ApplicationModule.prototype.__defineGetter__ ('policies', function () {
  return this.policyManager.policies;
});

ApplicationModule.prototype.__defineGetter__ ('models', function () {
  return this.modelManager.models;
});

ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  return this.controllerManager.controllers;
});

ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  return this.routerManager.routers;
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

