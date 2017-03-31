'use strict';

const winston = require ('winston')
  , path      = require ('path')
  , util      = require ('util')
  , fs        = require ('fs-extra')
  , all       = require ('require-all')
  , async     = require ('async')
  ;

const Server          = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework         = require ('./Framework')
  , Path              = require ('./Path')
  , Env               = require ('./Environment')
  , ModuleLoader      = require ('./ModuleLoader')
  , Barrier           = require ('./Barrier')
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

  this._modules = {};
  this._appInit = Barrier ('app.init', 'blueprint.app');
  this._appStart = Barrier ('app.start', 'blueprint.app');
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function (callback) {
  if (this.isInit)
    return callback (null, this);

  callback = callback || function (err, app) {};

  async.waterfall ([
    async.constant (this),

    // First, make sure there is a data directory. This is where the application stores
    // all its internal information.
    function (app, callback) {
      var tempPath = path.resolve (app._appPath, 'temp');
      fs.ensureDir (tempPath, function (err) { return callback (err, app); });
    },

    // Load all configurations first. This is because other entities in the
    // application may need the configuration object for initialization.
    function (app, callback) {
      var configPath = path.join (app._appPath, 'configs');

      Configuration (configPath, Env.name, function (err, configs) {
        if (err) return callback (err);
        app._configs = configs;

        return callback (null, app);
      });
    },

    // Load all the modules for the application.
    function (app, callback) {
      var modulesPath = path.resolve (app._appPath, '../node_modules');
      var moduleLoader = new ModuleLoader (app, modulesPath);
      moduleLoader.load (app._appPath, function (err) {
        return callback (err, app);
      });
    },

    // Let's configure the application module portion of the application.
    function (app, callback) {
      ApplicationModule.prototype.init.call (app, callback);
    },

    // Make the server object for the application.
    function (app, callback) {
      var server = new Server (app);

      server.configure (app._configs.server, function (err, server) {
        if (err) return callback (err);
        app._server = server;

        return callback (null, app);
      });
    },

    // Move the views to the correct location.
    function (app, callback) {
      if (!app.getSupportsViews ())
        return callback (null, app);

      var viewsPath = app.getViewsPath ();
      app._server.importViews (viewsPath, function (err) {
        return callback (err, app);
      });
    },

    // Make the router for the application. Then, install the router in the
    // server object. Part of loading the routers requires force loading of
    // the controllers. Otherwise, the router builder will not be able to
    // resolve any of the defined actions.
    function (app, callback) {
      var routersPath = path.resolve (app._appPath, 'routers');
      var builder = new RouterBuilder (app.controllers, routersPath);
      var routers = app.routers;

      app._router =
        builder
          .addRouters (routers)
          .getRouter ();

      app._server.setMainRouter (app._router);

      return callback (null, app);
    },

    function (app, callback) {
      // Mark the application as initialized.
      app.isInit = true;

      // Notify all listeners the application is initialized.
      Framework ().messaging.emit ('app.init', app);

      // Wait for all participants to signal they are ready to move on.
      app._appInit.signalAndWait (function () {
        callback (null, app);
      });
    }
  ], callback);
};

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param name
 * @param location
 * @param callback
 */
Application.prototype.addModule = function (name, appModule, callback) {
  if (this._modules.hasOwnProperty (name))
    throw new Error (util.format ('duplicate module: %s', name));

  this._modules[name] = appModule;

  async.waterfall ([
    async.constant (this),

    // Import the views from the module into the application.
    function (app, callback) {
      if (!app._server || !appModule.getSupportsViews ())
        return callback (null, app);

      app._server.importViews (appModule.getViewsPath (), function (err) {
        return callback (err, app);
      });
    },

    merge ('listenerManager'),
    merge ('modelManager'),
    merge ('policyManager'),
    merge ('validatorManager'),
    merge ('sanitizerManager')
  ], callback);

  function merge (managerName) {
    return function (app, callback) {
      app[managerName].merge (appModule[managerName]);
      return callback (null, app);
    }
  }
};

/**
 * Start the application. This method connects to the database, creates a
 * new server, and starts listening for incoming messages.
 *
 * @param callback
 */
Application.prototype.start = function (callback) {
  async.series ([
    /*
     * Start listening for events.
     */
    function (callback) {
      this._server.listen (callback);
    }.bind (this),

    /*
     * Notify all that we have started.
     */
    function (callback) {
      // Send a message to all listeners.
      Framework ().messaging.emit ('app.start', this);

      // Wait for all to respond that we can move on.
      this._appStart.signalAndWait (callback);
    }.bind (this)
  ], callback);
};

/**
 * Get modules loaded by the application.
 */
Application.prototype.__defineGetter__ ('modules', function () {
  return this._modules;
});

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('configs', function () {
  return this._configs;
});

/**
 * Get the application server.
 */
Application.prototype.__defineGetter__ ('server', function () {
  if (!this._server)
    throw new Error ('application did not configure server');

  return this._server;
});

/**
 * Read an application resource. If a callback is provided, then it reads the
 * resource asynchronously. If a callback is not provided, then the resource is
 * read synchronously.
 *
 * @param path          Path to resource
 * @param opts          Options for reading
 * @param callback      Optional callback
 */
Application.prototype.resource = function (location, opts, callback) {
  var fullPath = path.resolve (this._appPath, 'resources', location);

  if (callback)
    return fs.readfile (fullPath, opts, callback);
  else
    return fs.readFileSync (fullPath, opts);
};

module.exports = exports = Application;
