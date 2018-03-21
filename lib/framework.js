const assert    = require ('assert');
const program   = require ('commander');
const {env}     = require ('./environment');
const {version} = require ('../package.json');

const ClusterApplication = require ('./cluster');
const Application = require ('./application');
const CoreObject  = require ('./object');
const MessagingFramework = require ('./messaging/framework');

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
    this._super.init.call (this, ...arguments);
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
      this._app = new Application ({appPath, messaging: new MessagingFramework ()});

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

  destroyApplication () {
    assert (!!this._app, 'You must create an application before you can destroy it.');

    return this._app.destroy ( ).then (() => {
      this._app = null;
    });
  }
});
