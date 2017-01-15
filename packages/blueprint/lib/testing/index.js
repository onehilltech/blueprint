'use strict';

var async = require ('async')
  , lib = require ('../index')
  , messaging = lib.messaging
  ;

var exports = module.exports;
exports.createApplicationAndStart = createApplicationAndStart;
exports.waitFor = waitFor;

exports.request = require ('./request');

var started = false;

/**
 * Create an application, and emulate starting the application. Multiple
 * calls to this function will not produce different side-effects.
 *
 * @param appPath
 * @param callback
 */
function createApplicationAndStart (appPath, callback) {
  lib.Application (appPath, function (err, app) {
    if (err)
      return callback (err);

    if (!started) {
      messaging.emit ('app.start', app);
      started = true;
    }

    return callback (null, app);
  })
}

/**
 * Wait for a condition to occur before continuing.
 *
 * @param condition
 * @param callback
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
