var uid       = require ('uid-safe')
  , blueprint = require ('@onehilltech/blueprint')
  ;

const DEFAULT_SECRET_LENGTH = 128;

var Schema = blueprint.Schema;

var schema = new Schema ({
  /// Name of the client.
  name: {type: String, required: true, trim: true, unique: true},

  /// Contact email address for the client.
  email: {type: String, required: true, trim: true},

  /// Client secret.
  secret: {type: String, required: true},

  /// Redirect URI for the client.
  redirect_uri: {type: String, trim: true},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The different roles of the client.
  roles: {type: [String], default: []},

  /// Metadata for the client. This allows third-party services to
  /// associate custom data with the client.
  metadata : { type: Schema.Types.Mixed, default: {} }
});

schema.pre ('validate', function (next) {
  if (!this.isInit ('secret'))
    this.secret = uid.sync (DEFAULT_SECRET_LENGTH);

  return next ();
});

const COLLECTION_NAME = 'gatekeeper_client';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
