'use strict';

var mongoose           = require ('mongoose')
  , ConnectionManager  = require ('./ConnectionManager')
  , ResourceController = require ('./ResourceController')
  , GridFSController   = require ('./GridFSController')
  ;

var exports = module.exports = ConnectionManager;

exports.Types = mongoose.Types;
exports.Schema = mongoose.Schema;
exports.model = model;
exports.modelOn = modelOn;
exports.ResourceController = ResourceController;
exports.GridFSController = GridFSController;

/**
 * Create a model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 * @returns {*}
 */
function model (name, schema, collection) {
  return ConnectionManager.getConnectionManager ().defaultConnection.model (name, schema, collection);
}

/**
 * Create a model in a specific connection. If the connection does not
 * exist, then the model is not created.
 *
 * A model can only be created on one connection.
 *
 * @param connName      Name of the connection
 * @param name          Name of the model
 * @param schema        Model schema
 * @param collection    Name of the model collection
 */
function modelOn (connName, name, schema, collection) {
  var conn = ConnectionManager.getConnectionManager ().getConnection (connName);

  if (conn)
    return conn.model (name, schema, collection);
}
