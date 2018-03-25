const blueprint = require ('@onehilltech/blueprint');
const plugins = require ('./plugins');

const {
  Types,
  Schema
} = require ('mongoose');

/**
 * Create a model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 * @returns {*}
 */
function model (name, schema, collection) {
  let mongodb = blueprint.lookup ('service:mongodb');

  // Install the default plugins.
  schema.plugin (plugins.HiddenPlugin);
  schema.plugin (plugins.ConstPlugin);
  schema.plugin (plugins.LeanPlugin);

  return mongodb.defaultConnection.model (name, schema, collection);
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
  let mongodb = blueprint.lookup ('service:mongodb');
  let connection = mongodb.connections[connName];

  if (!connection)
    return null;

  // Install the default plugins.
  schema.plugin (plugins.HiddenPlugin);
  schema.plugin (plugins.ConstPlugin);
  schema.plugin (plugins.LeanPlugin);

  return connection.model (name, schema, collection);
}

/**
 * Create a resource on the target connection
 *
 * @param conn            Target connection
 * @param name            Name of resource
 * @param schema          Schema definition
 * @param collection      Name of collection
 */
function createResource (conn, name, schema, collection) {
  Object.defineProperty (schema.options, 'resource', {
    get: function () { return true; }
  });

  // Install the default plugins.
  schema.plugin (plugins.HiddenPlugin);
  schema.plugin (plugins.ConstPlugin);
  schema.plugin (plugins.StatPlugin);
  schema.plugin (plugins.LeanPlugin);

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
  let mongodb = blueprint.lookup ('service:mongodb');
  return createResource (mongodb.defaultConnection, name, schema, collection);
}

/**
 * Create a resource on a specific connection. If the connection does
 * not exist, then the resource model is not created.
 *
 * @param connName          Name of connection
 * @param name              Name of resource
 * @param schema            Schema definition
 * @param collection        Name of collection
 */
function resourceOn (connName, name, schema, collection) {
  let mongodb = blueprint.lookup ('service:mongodb');
  let connection = mongodb.connections[connName];

  if (connection)
    return createResource (connection, name, schema, collection);
}

exports.Types = Types;
exports.Schema = Schema;
exports.plugins = plugins;

// model definitions
exports.model = model;
exports.modelOn = modelOn;
exports.resource = resource;
exports.resourceOn = resourceOn;

exports.ResourceController = require ('./resource-controller');
exports.UserResourceController = require ('./UserResourceController');
exports.GridFSController = require ('./GridFSController');
exports.populate = require ('./populate');
exports.lean = require ('./lean');

