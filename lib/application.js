const ApplicationModule = require ('./application-module');
const Loader = require ('./loader');
const objectPath = require ('object-path');

module.exports = ApplicationModule.extend ({
  started: false,

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};
    /*

  this._appInit = Barrier ('app.init', 'blueprint.app');
  this._appStart = Barrier ('app.start', 'blueprint.app');
  this._appRestart = Barrier ('app.restart', 'blueprint.app');
     */
  },

  load () {
    return this._super.load (this, ...arguments).then (() => {
      // First, make sure there is a data directory. This is where the application
      // stores all its internal information.
      let tempPath = path.resolve (this.modulePath, 'temp');
      return fs.ensureDir (tempPath);
    }).then (() => {
      return this._loadConfigurationFiles ();
    }).then (configs => {
      // Load all the modules for the application that appear in the node_modules
      // directory. We consider these the auto-loaded modules for the application.
      // We handle these before the modules that are explicitly loaded by the application.

      this.configs = configs;
      this.name = objectPath.get (this._configs, 'app.name', 'unnamed');

      let modulesPath = path.resolve (this.modulePath, '../node_modules');
      let moduleLoader = new ModuleLoader (this, modulesPath);

      return moduleLoader.load (this.modulePath);
    }).then (() => {
      // Let's load the modules in the application config. These are modules that are
      // not automatically loaded by the application for reasons such as there not being
      // a node_modules directory for the application.

      let modules = objectPath.get (this._configs, 'app.modules', {});

      async.eachOf (modules, function (location, name, callback) {
        const modulePath = path.isAbsolute (location) ? location : path.resolve (this._appPath, location);

        async.waterfall ([
          function (callback) {
            fs.stat (modulePath, callback);
          },

          function (stats, callback) {
            if (!stats.isDirectory ())
              return callback (new Error ('module path must be a directory: ' + location));

            return callback (null);
          },

          function (callback) {
            ApplicationModule.createFromPath (modulePath, this._messaging, callback);
          }.bind (this),

          function (module, callback) {
            this.addModule (name, module, callback);
          }.bind (this)
        ], callback);
      }.bind (this), callback);
    }).then (() => {
      // Let's configure the application module portion of the application.
      ApplicationModule.prototype.init.call (this, callback);
    }).then (() => {
      // Make the server object for the application.
      this._server = new Server (this);
      return this._server.configure (this.configs.server);
    }).then (() => {
      // Move the views to the correct location.
      if (!this.getSupportsViews ())
        return callback (null);

      let viewsPath = this.getViewsPath ();
      return this._server.importViews (viewsPath);
    }).then (() => {
      // Make the router for the application. Then, install the router in the
      // server object. Part of loading the routers requires force loading of
      // the controllers. Otherwise, the router builder will not be able to
      // resolve any of the defined actions.
      let routersPath = path.resolve (this._appPath, 'routers');
      let builder = new RouterBuilder (this.controllers, routersPath);

      this._router = builder.addRouters (this.routers).getRouter ();
      this._server.setMainRouter (this._router);

      // Mark the application as initialized.
      this._isInit = true;
      this._messaging.emit ('app.init', this);

      // Wait for all participants to signal they are ready to move on.
      this._appInit.signalAndWait (callback);
    });
  },

  _loadConfigurationFiles () {
    let loader = new Loader ();
    let opts = {
      dirname: path.join (this.modulePath, 'configs')
    };

    return loader.load (opts);
  },

  /**
   * Add an application module to the application. An application module can only
   * be added once. Two application modules are different if they have the same
   * name, not module path. This will ensure we do not have the same module in
   * different location added to the application more than once.
   */
  addModule (name, appModule) {
    if (this._modules.hasOwnProperty (name))
      throw new Error (util.format ('duplicate module: %s', name));

    this._modules[name] = appModule;

    function complete (err) {
      return callback (err, this)
    }

    async.waterfall ([
      // Import the views from the module into the application.
      function (callback) {
        if (!this._server || !appModule.getSupportsViews ())
          return callback (null);

        this._server.importViews (appModule.getViewsPath (), callback);
      }.bind (this),

      merge.call (this, 'listenerManager'),
      merge.call (this, 'controllerManager'),
      merge.call (this, 'modelManager'),
      merge.call (this, 'policyManager'),
      merge.call (this, 'validatorManager'),
      merge.call (this, 'sanitizerManager')
    ], complete.bind (this));

    function merge (managerName) {
      return function (callback) {
        this[managerName].merge (appModule[managerName]);
        return callback (null);
      }.bind (this)
    }
  },

  destroy () {
    this._isStarted = false;
    this._isInit = false;

    if (!this._server)
      return callback (this);

    this._server.close (function (err) {
      return callback (err, this);
    }.bind (this));
  },

  /**
   * Start the application. This method connects to the database, creates a
   * new server, and starts listening for incoming messages.
   */
  start () {
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
  },

  restart () {
    // Reset the app.restart barrier.
    Barrier.reset ('app.restart');

    this._messaging.emit ('app.restart', this);
    this._appRestart.signalAndWait (callback);
  }
});

const winston  = require ('winston')
  , path       = require ('path')
  , util       = require ('util')
  , fs         = require ('fs-extra')
  , async      = require ('async')
  , objectPath = require ('object-path')
  ;

const Server          = require ('./Server')
  , all               = require ('./require')
  , RouterBuilder     = require ('./RouterBuilder')
  , ApplicationModule = require ('./ApplicationModule')
  , ModuleLoader      = require ('./ModuleLoader')
  , Barrier           = require ('./Barrier')
  ;

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
  let fullPath = path.resolve (this._appPath, 'resources', location);

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
