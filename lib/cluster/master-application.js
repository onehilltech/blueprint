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

  init () {
    this._super.init.apply (this, arguments);

    // Let's override the tempPath to include the process id. Otherwise, we run the risk
    // of running into issues when storing data into the temp directory.

    Object.defineProperty (this, 'tempPath', {
      get () {
        return path.resolve (this.appPath, `.blueprint/${process.pid}`);
      }
    });
  },

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
