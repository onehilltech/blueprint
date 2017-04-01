'use strict';

const mongodb = require ('../../../lib')
  , blueprint = require ('@onehilltech/blueprint')
  , appStart  = blueprint.barrier ('app.start', 'mongodb.openConnection')
  , debug     = require ('debug')('blueprint:modules:mongodb')
  , async     = require ('async')
  , winston   = require ('winston')
  , util      = require ('util')
  ;

/**
 * Error handler for opening database connections.
 *
 * @param key
 * @param callback
 */
function errorHandler (key, callback) {
  return function (err) {
    if (err)
      winston.log ('error', 'failed to open connection %s [%s]', key, util.inspect (err));

    return callback (err);
  }
}

/**
 * Open all connections defined in the configuration.
 */
function openConnections (app) {
  debug ('opening all connections to the database');

  var config = app.configs.mongodb;
  var connMgr = mongodb.getConnectionManager ();

  function done (err) {
    if (err)
      throw err;

    // Notify the barrier app.init barrier.
    blueprint.messaging.emit ('mongodb.connections.open', config.connections);
    appStart.signal ();
  }

  async.eachOf (config.connections, function (connOpts, connName, callback) {
    async.series ([
      function (callback) {
        debug ('opening connection ' + connName);
        connMgr.openConnection (connName, connOpts, errorHandler (connName, callback));
      },

      function (callback) {
        const eventName = 'mongodb.connection.' + connName + '.open';
        blueprint.messaging.emit (eventName, connName);

        return callback (null);
      }
    ], callback);
  }, done);
}

module.exports = openConnections;
