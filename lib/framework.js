const assert = require ('assert');
const CoreObject = require ('./object');
const fs = require ('fs');
const path = require ('path');
const {env} = require ('./environment');
const {version} = require ('../package.json');
const Application = require ('./application');

module.exports = CoreObject.extend ({
  version,

  /// The application installed in the framework.
  _app: null,

  /// The execution environment for the framework.
  env,

  init () {
    this._super.init.call (this, ...arguments);

    Object.defineProperty (this, 'app', {
      get () { return this._app; }
    });

    Object.defineProperty (this, 'hasApplication', {
      get () { return !!this._app; }
    });
  },

  /**
   * Create an application in the framework.
   *
   * @param appPath
   */
  createApplication (appPath) {
    assert (!this._app, 'The framework already has an application.');

    this._app = new Application ({appPath});
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

/**
 * Get the cluster support for the application from its configuration.
 *
 * @param appPath
 * @returns {boolean}
 */
function getClusterOption (appPath) {
  const appConfigPath = path.resolve (appPath, 'configs/app.config.js');
  const envAppConfigPath = path.resolve (appPath, `configs/${env}/app.config.js`);

  let appConfig = require (appConfigPath);
  let clusterSupport = appConfig.cluster || null;

  if (fs.existsSync (envAppConfigPath)) {
    let envAppConfig = require (envAppConfigPath);

    if (envAppConfig.cluster) {
      clusterSupport = envAppConfig.cluster;
    }
  }

  return clusterSupport;
}


/**
 * Factory method for creating an Blueprint.js application. The application is installed
 * in the main module.
 *
 * @param appPath
 * @param callback
 *
 * @constructor
 */
function createApplication (appPath, callback) {
  if (appInstance) {
    if (appPath !== appInstance.appPath)
      return callback (new Error ('Application is already initialized [' + appPath + ']'));

    return callback (null, appInstance)
  }

  const clusterOption = getClusterOption (appPath);

  if (clusterOption) {
    appInstance = require ('./cluster') (appPath, msgInstance, clusterOption, callback);
  }
  else {
    const Application = require ('./Application');
    appInstance = new Application (appPath, msgInstance);
  }

  appInstance.init (callback);
  return appInstance;
}
