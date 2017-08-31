'use strict';

const seed    = require ('../../support/seed')
  , util      = require ('util')
  , blueprint = require ('@onehilltech/blueprint')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.seed')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  ;

module.exports = function () {
  debug ('seeding database connections');

  function complete (err) {
    if (err)
      console.error (util.inspect (err))
  }

  async.waterfall ([
    function (callback) {
      blueprint.messaging.emit ('mongodb.seed.start', blueprint.app);
      seed (blueprint.app, callback);
    },

    function (callback) {
      blueprint.messaging.emit ('mongodb.seed.complete', blueprint.app);
      appStart.signalAndWait (callback);
    }
  ], complete);
};
