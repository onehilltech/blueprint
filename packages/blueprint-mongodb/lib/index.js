'use strict';

var mongoose = require ('mongoose')
  , blueprint = require ('blueprint')
  , messaging = blueprint.messaging
  ;

var exports = module.exports = mongoose;
exports.modelOn = modelOn;

// Locate the module configuration in the application. If there is no
// configuration, then we need to stop processing. This brings attention
// to the developer to resolve the problem.

var config = blueprint.app.configs['mongodb'];

if (!config) throw new Error ('Must define mongodb.config.js configuration');
if (!config.connections.default) throw new Error ('Must define a default connection');

var conns = { };

messaging.on ('app.start', function (app) {
  // Open all connections defined in the configuration.
  for (var key in config.connections) {
    if (config.connections.hasOwnProperty (key)) {
      var conn = conns[key];
      var opts = config.connections[key];

      conn.open (opts.connstr, opts.options);
    }
  }
});

// Create the connections defined in the configuration. The key is the name
// of the connection, and the value is the connection details.

for (var key in config.connections) {
  if (config.connections.hasOwnProperty (key))
    conns[key] = mongoose.createConnection ();
}

/**
 * Create a model in a specific connection. If the connection does not
 * exist, then the model is not created.
 *
 * A model can only be created on one connection.
 *
 * @param name          Name of the connection
 * @param model         Name of the model
 * @param schema        Model schema
 */
function modelOn (name, model, schema) {
  var conn = conns[name];

  if (conn)
    conn.model (model, schema);
}
