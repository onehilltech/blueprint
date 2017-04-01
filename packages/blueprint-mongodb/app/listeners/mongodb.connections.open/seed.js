'use strict';

const mongodb = require ('../../../lib')
  , blueprint = require ('@onehilltech/blueprint')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.seed')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  , winston   = require ('winston')
  , util      = require ('util')
;


function seed (connections) {
  winston.log ('error', 'seeding ' + util.inspect (connections));
  appStart.signal ();
}

module.exports = seed;
