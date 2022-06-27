const blueprint = require ('@onehilltech/blueprint');
const plugins = require ('./plugins');

const {
  HiddenPlugin,
  ConstPlugin,
  LeanPlugin,
  StatPlugin
} = plugins;

/**
 * Create a model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 * @returns {*}
 */
function model (name, schema, collection) {
  const mongodb = blueprint.lookup ('service:mongodb');
  return modelOnConnection (mongodb.defaultConnection, name, schema, collection);
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
  const mongodb = blueprint.lookup ('service:mongodb');
  const connection = mongodb.connections[connName];

  return modelOnConnection (connection, name, schema, collection);
}

function modelOnConnection (conn, name, schema, collection) {
  if (!conn)
    return;

  // Install the default
  schema.plugin (HiddenPlugin);
  schema.plugin (ConstPlugin);
  schema.plugin (LeanPlugin);

  return conn.model (name, schema, collection);
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
  if (!conn)
    return null;

  Object.defineProperty (schema.options, 'resource', { enumerable: true, writable: false, value: true });

  // Install the default
  schema.plugin (HiddenPlugin);
  schema.plugin (ConstPlugin);
  schema.plugin (StatPlugin);
  schema.plugin (LeanPlugin);

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
  const mongodb = blueprint.lookup ('service:mongodb');
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

  return connection ? createResource (connection, name, schema, collection) : null;
}

// model definitions
exports.model = model;
exports.modelOn = modelOn;
exports.resource = resource;
exports.resourceOn = resourceOn;
