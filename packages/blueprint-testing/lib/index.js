const blueprint = require ('@onehilltech/blueprint');

exports.request = require ('./request');

/**
 * Create an application, and start it. Calling this function multiple times
 * will not produce multiple side-effects.
 *
 * @param appPath
 * @param callback
 */
function createApplicationAndStart (appPath, callback) {
  async.waterfall ([
    function (callback) {
      blueprint.createApplication (appPath, callback);
    },

    function (app, callback) {
      app.start (callback);
    }
  ], callback);
}

/**
 * Wait for a condition to occur before continuing.
 *
 * @param condition
 * @param done
 */
function waitFor (condition, done) {
  async.until (
    condition,
    function (callback) {
      setTimeout (function () {
        callback (null);
      }, 1000);
    }, done);
}

exports.createApplicationAndStart = createApplicationAndStart;
exports.waitFor = waitFor;
