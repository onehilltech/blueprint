'use strict';

const mongodb = require ('../../../lib')
  , blueprint = require ('@onehilltech/blueprint')
  , _         = require ('underscore')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.seed')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  , winston   = require ('winston')
  , util      = require ('util')
  , path      = require ('path')
  , dab       = require ('@onehilltech/dab')
  ;

const SEEDS_RELATIVE_PATH = './seeds/mongodb';

function buildAndSeed (connName, spec, callback) {
  var conn = mongodb.getConnectionManager ().connections[connName];

  if (!conn)
    return callback (null);

  debug ('seeding connection ' + connName);

  async.waterfall ([
    /*
     * Clear the current data on the default connection.
     */
    function (callback) {
      dab.build (spec, callback);
    },

    /*
     * Build and seed the data model
     */
    function (data, callback) {
      async.waterfall ([
        function (callback) {
          dab.clear (conn, callback)
        },

        function (callback) {
          dab.seed (data, conn, callback);
        }
      ], callback);
    }
  ], callback);
}

var app = null;

blueprint.messaging.on ('app.init', function (param) {
  app = param;
});

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
  debug ('seeding database connections');

  const opts = {
    dirname: path.join (blueprint.app.appPath, SEEDS_RELATIVE_PATH),
    filter: /(.+)\.js$/,
    recursive: false,
    excludeDirs: /^\.(git|svn)$/
  };

  async.waterfall ([
    function (callback) {
      blueprint.require (opts, true, callback);
    },

    function (objects, callback) {
      async.mapValues (objects, function (dabSpec, connName, callback) {
        buildAndSeed (connName, dabSpec, callback)
      }, callback);
    },

    function (seeds, callback) {
      app.seeds = seeds;
      return callback (null);
    }
  ], complete);
}

module.exports = seed;
