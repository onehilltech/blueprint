'use strict';

const async   = require ('async')
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
 * Factory method for creating an Blueprint.js application. The application is installed
 * in the main module.
 *
 * @param appPath
 * @param callback
 *
 * @constructor
 */
exports.createApplication = function (appPath, callback) {
  const Application = require ('./Application');

  if (appInstance) {
    if (appPath !== appInstance.appPath)
      return callback (new Error (util.format ('Application is already initialized [path=%s]', appPath)));

    return callback (null, appInstance)
  }

  appInstance = new Application (appPath, msgInstance);
  appInstance.init (callback);

  return appInstance;
};

/**
 * Destroy the application.
 */
exports.destroyApplication = function (callback) {
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
};
