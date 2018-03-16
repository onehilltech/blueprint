const objectPath = require ('object-path');
const path       = require ('path');
const ModuleLoader = require ('./module-loader');
const ApplicationModule = require ('./application-module');
const MessagingFramework = require ('./messaging/framework');

/**
 * @class Application
 *
 * Wrapper class for the application. The Application class is an extension of
 * the ApplicationModule class.
 */
module.exports = ApplicationModule.extend ({
  /// The started state of the application.
  started: false,

  /// The messaging framework for the application.
  messaging: new MessagingFramework (),

  init () {
    this._super.init.apply (this, arguments);
    this._modules = {};

    /*

  this._appInit = Barrier ('app.init', 'blueprint.app');
  this._appStart = Barrier ('app.start', 'blueprint.app');
  this._appRestart = Barrier ('app.restart', 'blueprint.app');
     */

    Object.defineProperty (this, 'tempPath', {
      get () { return path.resolve (this.appPath, '.temp') }
    });
  },

  configure () {
    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.

    return fs.ensureDir (this.tempPath).then (() => {
      return this._loadConfigurationFiles ();
    }).then (configs => {
      // Store the loaded configuration files.
      this.configs = configs;
      this.name = objectPath.get (configs, 'app.name', '<unnamed>');

      // Load all the modules for the application that appear in the node_modules
      // directory. We consider these the auto-loaded modules for the application.
      // We handle these before the modules that are explicitly loaded by the application.

      let moduleLoader = new ModuleLoader (this);
      return moduleLoader.load ();
    }).then (() => {
      // Let's load the modules in the application config. These are modules that are
      // not automatically loaded by the application for reasons such as there not being
      // a node_modules directory for the application.

      let modules = objectPath.get (this.configs, 'app.modules', {});

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
      // Now, we can configure the module portion of the application since we know all
      // dependent artifacts needed by the application will be loaded.

      return this._super.configure.apply (this, arguments);
    }).then (() => {
      // Make the server object for the application, and configure it.

      this._server = new Server (this);
      return this._server.configure (this.configs.server);
    }).then (() => {
      // Import the views of the application into the server. The views of the
      // application will overwrite any views previously imported when we loaded
      // an application module.

      if (this.hasViews)
        return this._server.importViews (this.viewsPath);
    }).then (() => {
      // Use the loaded resources to build the router for the application.

    }).then ((router) => {
      // Install the built router into the server.
      this._server.setMainRouter (router);

      // Signal that we have initialized the application.
      this._init = true;

      this._messaging.emit ('blueprint.app.initialized', this);
      this._appInit.signalAndWait (callback);
    })
  },

  /**
   * Load the configuration files for the application. All configuration files are located
   * in the app/configs directory.
   *
   * @returns {Promise}       Promise object
   * @private
   */
  _loadConfigurationFiles () {
    const dirname = path.resolve (this.appPath, 'configs');
    return this._defaultLoader.load ({dirname});
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

    let firstTask = appModule.hasViews ? this._server.importViews (appModule.viewsPath) : Promise.resolve ();

    return firstTask.then (() => {
      return this.merge (appModule);
    });
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
