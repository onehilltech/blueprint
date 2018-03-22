const Application = require ('../application');
const path = require ('path');

/**
 * @class WorkerApplication
 *
 * The worker application in the cluster. The worker application perform all the
 * work when processing requests.
 */
module.exports = Application.extend ({
  init () {
    this._super.init.apply (this, arguments);

    // Let's override the tempPath to include the process id. Otherwise, we run the risk
    // of running into issues when storing data into the temp directory.

    Object.defineProperty (this, 'tempPath', {
      get () {
        return path.resolve (this.appPath, `.blueprint/${process.pid}`);
      }
    });
  }
});
