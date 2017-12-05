'use strict';

const async   = require ('async')
  , fs        = require ('fs')
  , path      = require ('path')
  , Env       = require ('./Environment')
  , Messaging = require ('./Messaging')
  , version   = require ('../package.json').version
  ;

// Make sure Blueprint has been instantiated in the main process. This instance
// is used by the current application, and its dependencies to ensure operate in
// the same address space without version problems.

var appInstance = null;
var msgInstance = new Messaging ();

var exports = module.exports = {};

/**
 * Get the application for the module. If the application has not been
 * initialized, then an exception is thrown.
 */
Object.defineProperty (exports, 'app', {
  get: function () { return appInstance; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'messaging', {
  get: function () { return msgInstance; }
});

/**
 * Get the messaging module.
 */
Object.defineProperty (exports, 'version', {
  get: function () { return version; }
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

/**
 * Create an application, and start it.
 *
 * @param appPath
 * @param callback
 */
function createApplicationAndStart (appPath, callback) {
  async.waterfall ([
    function (callback) {
      createApplication (appPath, callback);
    },

    function (app, callback) {
      app.start (callback);
    }
  ], callback);
}

/**
 * Destroy the application.
 */
function destroyApplication (callback) {
  if (!appInstance)
    return callback (null);

  // Reset the messaging framework.
  msgInstance.reset ();

  async.waterfall ([
    function (callback) {
      appInstance.destroy (callback);
    },

    function (app, callback) {
      appInstance = null;
      return callback (null);
    }
  ], callback);
}

exports.createApplication = createApplication;
exports.createApplicationAndStart = createApplicationAndStart;
exports.destroyApplication = destroyApplication;
