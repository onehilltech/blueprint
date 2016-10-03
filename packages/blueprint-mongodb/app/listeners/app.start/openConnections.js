'use strict';

var mongodb = require ('../../../lib')
  , winston = require ('winston')
  , util    = require ('util')
  ;

module.exports = openConnections;

/**
 * Open all connections defined in the configuration.
 */
function openConnections (app) {
  winston.log ('info', 'opening all connections to the database');

  var config = app.configs.mongodb;
  var connMgr = mongodb.getConnectionManager ();

  for (var key in config.connections) {
    if (config.connections.hasOwnProperty (key)) {
      var opts = config.connections[key];
      connMgr.openConnection (key, opts, errorHandler (key));
    }
  }
}

/**
 * Error handler for opening database connections.
 *
 * @param key
 * @returns {Function}
 */
function errorHandler (key) {
  return function (err) {
    if (err)
      winston.log ('error', 'Failed to connect to %s [%s]', key, util.inspect (err));
  }
}
