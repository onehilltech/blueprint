const CoreObject = require ('../object');

/**
 * @class MasterApplication
 *
 * The master application in the cluster. The master application is responsible
 * for communicating with the worker applications.
 *
 * Right now, we do not coordinate the startup sequence. This allows each worker
 * to run at its own pace.
 */
module.exports = CoreObject.extend ({
  appPath: null,
  messaging: null,

  configure () {
    return Promise.resolve (this);
  },

  start () {
    return Promise.resolve (this);
  },

  restart () {
    return Promise.resolve (this);
  },

  destroy () {
    return Promise.resolve (this);
  }
});
