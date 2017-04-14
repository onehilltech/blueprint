'use strict';

var uid     = require ('uid-safe')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , options = require ('./commonOptions') ()
  ;

options.discriminatorKey = 'type';

var schema = new mongodb.Schema ({
  /// The type of client.
  type: {type: String, required: true},

  /// Name of the client.
  name: {type: String, required: true, trim: true, unique: true},

  /// Contact email address for the client.
  email: {type: String, required: true, trim: true},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The default scope for the client. The scope is applied to the access
  /// token for the client.
  scope: {type: [String], default: []}
}, options);

const MODEL_NAME = 'client';
const COLLECTION_NAME = 'gatekeeper_clients';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
