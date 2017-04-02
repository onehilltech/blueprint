'use strict';

const winston  = require ('winston')
  , path       = require ('path')
  , util       = require ('util')
  , fs         = require ('fs-extra')
  , all        = require ('require-all')
  , async      = require ('async')
  , objectPath = require ('object-path')
  ;

const Server          = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , ApplicationModule = require ('./ApplicationModule')
  , Env               = require ('./Environment')
  , ModuleLoader      = require ('./ModuleLoader')
  , Barrier           = require ('./Barrier')
  ;

/**
 * @class Application
 *
 * The main Blueprint.js application.
 *
 * @param appPath         Path to the application
 * @param messaging       Messaging module
 *
 * @constructor
 */
function Application (appPath, messaging) {
  ApplicationModule.call (this, appPath, messaging);

  this._modules = {};
  this._appInit = Barrier ('app.init', 'blueprint.app');
  this._appStart = Barrier ('app.start', 'blueprint.app');
  this._isInit = false;
  this._isStarted = false;
}

util.inherits (Application, ApplicationModule);

module.exports = Application;

/**
 * Initialize the application.
 */
Application.prototype.init = function (callback) {
  if (this._isInit)
    return callback (null, this);

  callback = callback || function (err, app) {};

  async.waterfall ([
    // First, make sure there is a data directory. This is where the application stores
    // all its internal information.
    function (callback) {
      var tempPath = path.resolve (this._appPath, 'temp');
      fs.ensureDir (tempPath, callback);
    }.bind (this),

    // Load all configurations first. This is because other entities in the
    // application may need the configuration object for initialization.
    function (dummy, callback) {
      var configPath = path.join (this._appPath, 'configs');
      Configuration (configPath, Env.name, callback);
    }.bind (this),

    // Load all the modules for the application that appear in the node_modules
    // directory. We consider these the auto-loaded modules for the application.
    // We handle these before the modules that are explicitly loaded by the application.
    function (configs, callback) {
      this._configs = configs;
      this.name = objectPath.get (this._configs, 'app.name', 'unnamed');

      var modulesPath = path.resolve (this._appPath, '../node_modules');
      var moduleLoader = new ModuleLoader (this, modulesPath);
      moduleLoader.load (this._appPath, callback);
    }.bind (this),

    // Let's load the modules in the application config. These are modules that are
    // not automatically loaded by the application for reasons such as there not being
    // a node_modules directory for the application.
    function (callback) {
      var modules = objectPath.get (this._configs, 'app.modules', {});

      async.eachOf (modules, function (location, name, callback) {
        const modulePath = path.isAbsolute (location) ? location : path.resolve (this._appPath, location);

        async.waterfall ([
          function (callback) {
            ApplicationModule.createFromPath (modulePath, this._messaging, callback);
          }.bind (this),

          function (module, callback) {
            this.addModule (name, module, callback);
          }.bind (this)
        ], callback);
      }.bind (this), callback);
    }.bind (this),

    // Let's configure the application module portion of the application.
    function (callback) {
      ApplicationModule.prototype.init.call (this, callback);
    }.bind (this),

    // Make the server object for the application.
    function (app, callback) {
      app._server = new Server (app);
      app._server.configure (app._configs.server, callback);
    },

    /*
     * Move the views to the correct location.
     */
    function (callback) {
      if (!this.getSupportsViews ())
        return callback (null);

      var viewsPath = this.getViewsPath ();
      this._server.importViews (viewsPath, callback);
    }.bind (this),

    // Make the router for the application. Then, install the router in the
    // server object. Part of loading the routers requires force loading of
    // the controllers. Otherwise, the router builder will not be able to
    // resolve any of the defined actions.
    function (callback) {
      var routersPath = path.resolve (this._appPath, 'routers');
      var builder = new RouterBuilder (this.controllers, routersPath);

      this._router = builder.addRouters (this.routers).getRouter ();
      this._server.setMainRouter (this._router);

      // Mark the application as initialized.
      this._isInit = true;
      this._messaging.emit ('app.init', this);

      // Wait for all participants to signal they are ready to move on.
      this._appInit.signalAndWait (callback);
    }.bind (this),

    function (callback) {
      return callback (null, this);
    }.bind (this)
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
  if (this._isStarted)
    return callback (null, this);

  function done (err) {
    return callback (err, this);
  }

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
      this._isStarted = true;
      this._messaging.emit ('app.start', this);

      // Wait for all to respond that we can move on.
      this._appStart.signalAndWait (callback);
    }.bind (this)
  ], done.bind (this));
};

/**
 * Destroy the application.
 *
 * @param callback
 */
Application.prototype.destroy = function (callback) {
  this._isStarted = false;
  this._isInit = false;

  if (!this._server)
    return callback (this);

  this._server.close (function (err) {
    return callback (err, this);
  }.bind (this));
};

Application.prototype.__defineGetter__ ('isInit', function () {
  return this._isModuleInit && this._isInit;
});

Application.prototype.__defineGetter__ ('isStarted', function () {
  return this._isStarted;
});

Application.prototype.__defineGetter__ ('modules', function () {
  return this._modules;
});

Application.prototype.__defineGetter__ ('configs', function () {
  return this._configs;
});

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

/**
 * Test if the application has a specific module.
 *
 * @param name
 * @returns {boolean}
 */
Application.prototype.hasModule = function (name) {
  return this._modules[name] !== undefined;
};
