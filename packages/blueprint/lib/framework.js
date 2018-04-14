const assert    = require ('assert');
const program   = require ('commander');
const {env}     = require ('./environment');
const {version} = require ('../package.json');

const ClusterApplication = require ('./cluster');
const Application = require ('./application');
const CoreObject  = require ('./object');
const messaging = require ('./messaging');

/**
 * @class Framework
 */
module.exports = CoreObject.extend ({
  version,

  /// The application installed in the framework.
  _app: null,

  /// The execution environment for the framework.
  env,

  init () {
    this._super.call (this, ...arguments);
    this._parseCommandLineOptions ();

    Object.defineProperty (this, 'app', {
      get () { return this._app; }
    });

    Object.defineProperty (this, 'hasApplication', {
      get () { return !!this._app; }
    });
  },

  /**
   * Parse the command-line options.
   *
   * @private
   */
  _parseCommandLineOptions () {
    program
      .option ('--cluster [workers]', 'Run cluster mode with optional number of workers', parseInt)
      .parse (process.argv);

    this.cluster = program.cluster;
  },

  /**
   * Create an application in the framework.
   *
   * @param appPath
   */
  createApplication (appPath) {
    assert (!this._app, 'The framework already has an application.');

    if (this.cluster)
      this._app = new ClusterApplication ({appPath, cluster: this.cluster});
    else
      this._app = new Application ({appPath, messaging: messaging () });

    return this._app.configure ();
  },

  /**
   * Create an application in the framework as start it.
   *
   * @param appPath
   */
  createApplicationAndStart (appPath) {
    return this.createApplication (appPath).then (app => {
      return app.start ();
    });
  },

  /**
   * Destroy the application.
   *
   * @returns {Promise<any>}
   */
  destroyApplication () {
    if (!this._app)
      return Promise.resolve ();

    return this._app.destroy ().then (() => {
      this._app = null;
    });
  },

  /**
   * Lookup a loaded component.
   *
   * The name of the component must have the format <type:name>.
   *
   * Ex.
   *
   *   lookup ('controller:main')
   *   lookup ('config:app')
   *
   * @param component       Name of the component.
   */
  lookup (component) {
    return this._app.lookup (component);
  },

  /**
   * Load an asset from the main application.
   *
   * @param filename
   * @param opts
   * @param callback
   * @returns {*}
   */
  asset (filename, opts, callback) {
    return this._app.asset (filename, opts, callback);
  },

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  mount (routerName) {
    return this._app.mount (routerName);
  }
});
