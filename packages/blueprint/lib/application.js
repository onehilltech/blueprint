const {get} = require ('object-path');
const path  = require ('path');
const {ensureDir} = require ('fs-extra');
const debug  = require ('debug')('blueprint:app');
const assert = require ('assert');

const {
  forOwn
} = require ('lodash');

const lookup = require ('./-lookup');

const BlueprintObject   = require ('./object');
const ApplicationModule = require ('./application-module');
const ModuleLoader      = require ('./module-loader');
const barrier           = require ('./barrier');
const RouterBuilder     = require ('./router-builder');
const Server            = require ('./server');
const Loader            = require ('./loader');

const {
  Events
} = require ('./messaging');

const DEFAULT_APPLICATION_NAME = '<unnamed>';
const APPLICATION_MODULE_NAME = '$';

/**
 * @class Application
 *
 * The main application.
 */
module.exports = BlueprintObject.extend (Events, {
  /// The started state of the application.
  started: false,

  /// The application module for the application.
  _appModule: null,

  /// The loader used by the application module.
  _defaultLoader: new Loader (),

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};

    // barriers
    this._appInit = barrier ('blueprint.app.init', this);
    this._appStart = barrier ('blueprint.app.start', this);
    this._appRestart = barrier ('blueprint.app.restart', this);

    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.
    this._appModule = new ApplicationModule ({app: this, modulePath: this.appPath});
    this._server = new Server ({app: this});

    Object.defineProperty (this, 'tempPath', {
      configurable: true,
      get () { return path.resolve (this.appPath, '.blueprint'); }
    });

    Object.defineProperty (this, 'resources', {
      get () { return this._appModule.resources; }
    });

    Object.defineProperty (this, 'server', {
      get () { return this._server; }
    });
  },

  /**
   * Configure the application.
   */
  configure () {
    return ensureDir (this.tempPath)
      .then (() => this._loadConfigurationFiles ())
      .then (configs => {
        // Store the loaded configuration files.
        this.configs = configs;
        this.name = get (configs, 'app.name', DEFAULT_APPLICATION_NAME);

        // Load all the modules for the application that appear in the node_modules
        // directory. We consider these the auto-loaded modules for the application.
        // We handle these before the modules that are explicitly loaded by the application.

        let moduleLoader = new ModuleLoader ({app: this});
        return moduleLoader.load ();
      })
      // Now, we can configure the module portion of the application since we know all
      // dependent artifacts needed by the application will be loaded.
      .then (() => this._appModule.configure ())
      .then (appModule => this.addModule (APPLICATION_MODULE_NAME, appModule))
      .then (() => {
        // Allow the loaded services to configure themselves.
        let {services} = this.resources;
        let promises = [];

        forOwn (services, (service, name) => {
          debug (`configuring service ${name}`);
          promises.push (service.configure ());
        });

        return Promise.all (promises);
      })
      .then (() => this._server.configure (this.configs.server))
      // Import the views of the application into the server. The views of the
      // application will overwrite any views previously imported when we loaded
      // an application module.
      .then (() => this._appModule.hasViews ? this._server.importViews (this._appModule.viewsPath) : null)
      .then (() => {
        const {routers} = this.resources;

        const builder = new RouterBuilder (this.resources);
        return builder.addRouter ('/', routers).build ();
      })
      .then (router => {
        // Install the built router into the server.
        this._server.setMainRouter (router);
        this.emit ('blueprint.app.initialized', this);
        return this._appInit.signal ();
      })
      .then (() => this);
  },

  /**
   * Destroy the application.
   */
  destroy () {
    // Instruct each service to destroy itself.
    let {services} = this.resources;
    let promises = [];

    forOwn (services, (service, name) => {
      debug (`destroying service ${name}`);
      promises.push (service.destroy ());
    });

    return Promise.all (promises);
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

    const firstTask = appModule.hasViews ? this._server.importViews (appModule.viewsPath) : Promise.resolve ();
    firstTask.then (() => this._appModule.merge (appModule));
  },

  /**
   * Start the application. This method connects to the database, creates a
   * new server, and starts listening for incoming messages.
   */
  start () {
    // Notify the listeners that we are able to start the application. This
    // will allow them to do any preparations.
    this.emit ('blueprint.app.starting', this);

    // Start all services, then start the server.

    // Allow the loaded services to configure themselves.
    let {services} = this.resources;
    let promises = [];

    forOwn (services, (service, name) => {
      debug (`starting service ${name}`);
      promises.push (service.start ());
    });

    return Promise.all (promises)
      .then (() => this._server.listen ())
      .then (() => {
        // Notify all listeners that the application has started.
        this.started = true;
        this.emit ('blueprint.app.started', this);

        return this._appStart.signal ();
      });
  },

  /**
   * Restart the application.
   */
  restart () {
    // Reset the app.restart barrier.
    barrier.reset ('blueprint.app.restart');

    this.emit ('blueprint.app.restart', this);
    return this._appRestart.signal ();
  },

  /**
   * Lookup a component, including configurations, in the application.
   *
   * @param component
   * @returns {*}
   */
  lookup (component) {
    if (component.startsWith ('config:')) {
      let configProperty = component.slice (7);
      return get (this.configs, configProperty);
    }
    else {
      return lookup (this.resources, component);
    }
  },

  /**
   * Load an application asset.
   *
   * @param filename
   * @param opts
   * @param callback
   * @returns {*}
   */
  asset (filename, opts, callback) {
    return this._appModule.asset (filename, opts, callback);
  },

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  mount (routerName) {
    const router = this.lookup (`router:${routerName}`);

    const controllers = get (this.resources, 'controllers');
    const policies = get (this.resources, 'policies');

    assert (!!router, `The router "${routerName}" does not exist.`);

    const builder = new RouterBuilder ({controllers, policies});
    return builder.addRouter ('/', router).build ();
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
