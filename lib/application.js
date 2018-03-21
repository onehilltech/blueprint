const {get}       = require ('object-path');
const path        = require ('path');
const {ensureDir} = require ('fs-extra');

const ApplicationModule  = require ('./application-module');
const ModuleLoader       = require ('./module-loader');
const barrier            = require ('./barrier');
const RouterBuilder      = require ('./router-builder');
const Server             = require ('./server');

/**
 * @class Application
 *
 * Wrapper class for the application. The Application class is an extension of
 * the ApplicationModule class.
 */
module.exports = ApplicationModule.extend ({
  /// The started state of the application.
  started: false,

  /// Reference to the messaging framework.
  messaging: null,

  init () {
    this._super.init.apply (this, arguments);
    this._modules = {};

    // barriers
    this._appInit = barrier ('blueprint.app.init', 'blueprint.application');
    this._appStart = barrier ('blueprint.app.start', 'blueprint.application');
    this._appRestart = barrier ('blueprint.app.restart', 'blueprint.application');

    Object.defineProperty (this, 'tempPath', {
      get () { return path.resolve (this.appPath, '.temp') }
    });
  },

  /**
   * Configure the application.
   */
  configure () {
    const _super = this._super;

    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.

    return ensureDir (this.tempPath).then (() => {
      return this._loadConfigurationFiles ();
    }).then (configs => {
      // Store the loaded configuration files.
      this.configs = configs;
      this.name = get (configs, 'app.name', '<unnamed>');

      // Load all the modules for the application that appear in the node_modules
      // directory. We consider these the auto-loaded modules for the application.
      // We handle these before the modules that are explicitly loaded by the application.

      let moduleLoader = new ModuleLoader ({app: this});
      return moduleLoader.load ();
    }).then (() => {
      // Now, we can configure the module portion of the application since we know all
      // dependent artifacts needed by the application will be loaded.

      return _super.configure.apply (this, arguments);
    }).then (() => {
      // Make the server object for the application, and configure it.

      this._server = new Server ({app: this});
      return this._server.configure (this.configs.server);
    }).then (() => {
      // Import the views of the application into the server. The views of the
      // application will overwrite any views previously imported when we loaded
      // an application module.

      if (this.hasViews)
        return this._server.importViews (this.viewsPath);
    }).then (() => {
      // Use the loaded resources to build the router for the application.

      return new RouterBuilder (this.resources).build ();

    }).then ((router) => {

      // Install the built router into the server.
      this._server.setMainRouter (router);
      this.messaging.emit ('blueprint.app.initialized', this);
      return this._appInit.signal ();
    }).then (() => {
      return this;
    });
  },

  /**
   * Add an application module to the application. An application module can only
   * be added once. Two application modules are different if they have the same
   * name, not module path. This will ensure we do not have the same module in
   * different location added to the application more than once.
   */
  addModule (name, appModule) {
    if (this._modules.hasOwnProperty (name))
      throw new Error (`duplicate module ${name}`);

    this._modules[name] = appModule;

    if (!appModule.hasViews)
      return this.merge (appModule);

    return this._server.importViews (appModule.viewsPath).then (() => {
      return this.merge (appModule);
    });
  },

  /**
   * Start the application. This method connects to the database, creates a
   * new server, and starts listening for incoming messages.
   */
  start () {
    // Notify the listeners that we are able to start the application. This
    // will allow them to do any preparations.
    this.messaging.emit ('blueprint.app.starting', this);

    return this._server.listen ().then (() => {
      // Notify all listeners that the application has started.
      this.started = true;
      this.messaging.emit ('blueprint.app.started', this);

      return this._appStart.signal ();
    });
  },

  /**
   * Restart the application.
   */
  restart () {
    // Reset the app.restart barrier.
    barrier.reset ('blueprint.app.restart');

    this.messaging.emit ('blueprint.app.restart', this);
    return this._appRestart.signal ();
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
  }
});
