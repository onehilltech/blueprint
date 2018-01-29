const assert = require ('assert');
const Object = require ('./object');
const fs = require ('fs');
const path = require ('path');
const Env = require ('./environment');
const version = require ('../package.json').version;

module.exports = Object.extend ({
  version,

  /// The application installed in the framework.
  app: null,

  hasApplication () {
    return !!this.app;
  },

  createApplication (appPath) {
    assert (!this.app, 'The framework already has an application.');
  },

  createApplicationAndStart (appPath) {
    return this.createApplication (appPath).then (app => {
      return app.start ();
    });
  },

  destroyApplication () {
    if (!this.app)
      return Promise.resolve ();

    return this.app.destroy ( ).then (() => {
      this.app = null;
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
  const envAppConfigPath = path.resolve (appPath, 'configs/' + Env.name + '/app.config.js');

  var appConfig = require (appConfigPath);
  var clusterSupport = appConfig.cluster || null;

  if (fs.existsSync (envAppConfigPath)) {
    var envAppConfig = require (envAppConfigPath);

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
