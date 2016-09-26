'use strict';

var mongoose = require ('mongoose')
  , blueprint = require ('@onehilltech/blueprint')
  , ConnectionManager = require ('./ConnectionManager')
  ;

const DEFAULT_CONNECTION_NAME = '$default';

// Locate the module configuration in the application. If there is no
// configuration, then we need to stop processing. This brings attention
// to the developer to resolve the problem.

var config = blueprint.app.configs['mongodb'];
if (!config) throw new Error ('Must define mongodb.config.js configuration');

var defaultConnection = config.defaultConnection || DEFAULT_CONNECTION_NAME;
var connsConfig = config['connections'];

if (!connsConfig || connsConfig.length == 0) throw new Error ('Must define at least one connection');
if (!connsConfig[defaultConnection]) throw new Error ('Default connection configuration not defined');

// Create the connections defined in the configuration. The key is the name
// of the connection, and the value is the connection details.

var opts = {
  defaultConnection: defaultConnection
};

var connMgr = new ConnectionManager (opts);

for (var key in connsConfig) {
  if (connsConfig.hasOwnProperty (key))
    connMgr.createConnection (key);
}

var exports = module.exports = connMgr;

exports.Types = mongoose.Types;
exports.Schema = mongoose.Schema;
exports.model = model;
exports.modelOn = modelOn;

/**
 * Create a model on the default connection.
 *
 * @param name
 * @param schema
 * @param collection
 * @returns {*}
 */
function model (name, schema, collection) {
  return connMgr.defaultConnection.model (name, schema, collection);
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
  var conn = connMgr.getConnection (connName);

  if (conn)
    return conn.model (name, schema, collection);
}
