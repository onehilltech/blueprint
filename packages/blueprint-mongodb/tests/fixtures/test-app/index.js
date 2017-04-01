'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , path        = require ('path')
  , async       = require ('async')
  ;

const appPath = path.resolve (__dirname, './app');

module.exports = function (callback) {
  async.waterfall ([
    function (callback) {
      blueprint.Application (appPath, callback);
    },

    function (app, callback) {
      async.waterfall ([
        function (callback) {
          const modulePath = path.resolve (__dirname, '../../../app');
          blueprint.ApplicationModule.createFromPath (modulePath, callback);
        },

        function (module, callback) {
          app.addModule ('mongodb', module, callback);
        },

        function (app, callback) {
          app.start (callback);
        }
      ], callback);
    }
  ], callback);
};

