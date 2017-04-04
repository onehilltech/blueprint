'use strict';

const seed     = require ('../../support/seed')
  , blueprint  = require ('@onehilltech/blueprint')
  , appRestart = blueprint.barrier ('app.restart', 'mongodb.seed')
  , debug      = require ('debug')('blueprint:modules:mongodb')
  , async      = require ('async')
  ;

module.exports = function (app) {
  debug ('reseeding database connections');

  async.waterfall ([
    function (callback) {
      seed (app, callback);
    },

    function (callback) {
      appRestart.signalAndWait (callback);
    }
  ]);
};
