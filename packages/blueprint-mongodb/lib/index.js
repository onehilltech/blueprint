'use strict';

var mongoose           = require ('mongoose')
  , ConnectionManager  = require ('./ConnectionManager')
  , ResourceController = require ('./ResourceController')
  , GridFSController   = require ('./GridFSController')
  , populate           = require ('./populate')
  , plugins            = require ('./plugins')
  ;

var exports = module.exports = ConnectionManager;

/**
 * Create a model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 * @returns {*}
 */
function model (name, schema, collection) {
  // Install the default plugins.
  schema.plugin (plugins.HiddenPlugin);

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

  if (conn) {
    // Install the default plugins.
    schema.plugin (plugins.HiddenPlugin);

    return conn.model (name, schema, collection);
  }
}

function createResource (conn, name, schema, collection) {
  Object.defineProperty (schema.options, 'resource', {
    get: function () { return true; }
  });

  // Install the default plugins.
  schema.plugin (plugins.HiddenPlugin);
  schema.plugin (plugins.StatPlugin);

  return conn.model (name, schema, collection);
}

/**
 * Create a resource model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 */
function resource (name, schema, collection) {
  var conn = ConnectionManager.getConnectionManager ().defaultConnection;
  return createResource (conn, name, schema, collection);
}

/**
 * Create a resource on a specific connection. If the connection does
 * not exist, then the resource model is not created.
 *
 * @param connName
 * @param name
 * @param schema
 * @param collection
 */
function resourceOn (connName, name, schema, collection) {
  var conn = ConnectionManager.getConnectionManager ().getConnection (connName);

  if (conn)
    return createResource (conn, name, schema, collection);
}

/**
 * Load the testing module on demand.
 */
exports.__defineGetter__ ('testing', function () {
  return require ('./testing');
});

exports.Types = mongoose.Types;
exports.Schema = mongoose.Schema;
exports.plugins = plugins;
exports.model = model;
exports.modelOn = modelOn;
exports.ResourceController = ResourceController;
exports.GridFSController = GridFSController;
exports.populate = populate;
exports.resource = resource;
exports.resourceOn = resourceOn;

