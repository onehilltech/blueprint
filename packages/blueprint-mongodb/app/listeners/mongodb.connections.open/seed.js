'use strict';

const seed    = require ('../../support/seed')
  , blueprint = require ('@onehilltech/blueprint')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.seed')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  ;

module.exports = function () {
  debug ('seeding database connections');

  async.waterfall ([
    function (callback) {
      seed (blueprint.app, callback);
    },

    function (callback) {
      appStart.signalAndWait (callback);
    }
  ]);
};
