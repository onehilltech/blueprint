'use strict';

var path      = require ('path')
  , async     = require ('async')
  , blueprint = require ('./lib')
  , ApplicationModule = require ('../../lib/ApplicationModule')
  ;

module.exports = function (callback) {
  // Remove all previous barriers.
  blueprint.barrier.removeAll ();

  async.waterfall ([
    function (callback) {
      // Create the application.
      var appPath = path.resolve (__dirname, './app');
      blueprint.createApplication (appPath, callback);
    },

    function (app, callback) {
      const location = path.resolve (__dirname, './app-module');

      if (app.hasModule ('test-module'))
        return callback (null, app);

      async.waterfall ([
        function (callback) {
          ApplicationModule.createFromPath (location, app.messaging, callback);
        },

        function (appModule, callback) {
          app.addModule ('test-module', appModule, callback);
        }
      ], callback);
    }
  ], callback);
};
