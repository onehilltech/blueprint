'use strict';

const mongodb = require ('../../../lib')
  , blueprint = require ('@onehilltech/blueprint')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.seed')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  , winston   = require ('winston')
  , util      = require ('util')
  , path      = require ('path')
  , fs        = require ('fs-extra')
  , dab       = require ('@onehilltech/dab')
  ;

function buildAndSeed (seedFile, callback) {
  var seed = require (seedFile);

  async.waterfall ([
    /*
     * Clear the current data on the default connection.
     */
    function (callback) {
      dab.clear (mongodb.getConnectionManager ().defaultConnection, callback)
    },

    /*
     * Build the data model
     */
    function (callback) {
      dab.build (seed, callback);
    },

    /*
     * Use the data model to seed the database.
     */
    function (data, callback) {
      dab.seed (data, mongodb.getConnectionManager ().defaultConnection, callback);
    },

    function (models, callback) {
      blueprint.messaging.emit ('mongodb.connection.seeded', models);
      return callback (null);
    }
  ], callback);
}

/**
 * The listener is complete, and can signal the application.
 *
 * @param err
 */
function complete (err) {
  if (err)
    throw err;

  appStart.signal ();
}

/**
 * Main entry point for the listener to seed the database.
 */
function seed () {
  debug ('seeding default connection');
  const seed = path.resolve (blueprint.app.appPath, './seeds/mongodb/' + blueprint.env + '.js');

  if (fs.existsSync (seed)) {
    buildAndSeed (seed, complete);
  }
  else {
    complete (null);
  }
}

module.exports = seed;
