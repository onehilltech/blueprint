'use strict';

var uid     = require ('uid-safe')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , options = require ('./commonOptions') ()
  ;

options.discriminatorKey = 'type';

const DEFAULT_SECRET_LENGTH = 128;

var schema = new mongodb.Schema ({
  /// Name of the client.
  name: {type: String, required: true, trim: true, unique: true},

  /// Contact email address for the client.
  email: {type: String, required: true, trim: true},

  /// Client secret.
  secret: {type: String, required: true, validation: {optional: true}},

  /// Redirect URI for the client.
  redirect_uri: {type: String, trim: true},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The default scope for the client. The scope is applied to the access
  /// token for the client.
  scope: {type: [String], default: []},

  /// Metadata for the client. This allows third-party services to
  /// associate custom data with the client.
  metadata : { type: mongodb.Schema.Types.Mixed, default: {} }
}, options);

schema.pre ('validate', function (next) {
  if (!this.secret)
    this.secret = uid.sync (DEFAULT_SECRET_LENGTH);

  return next ();
});

const MODEL_NAME = 'client';
const COLLECTION_NAME = 'gatekeeper_clients';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
