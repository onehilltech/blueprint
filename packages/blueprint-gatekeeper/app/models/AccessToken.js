'use strict';

const mongodb = require ('@onehilltech/blueprint-mongodb')
  , Client    = require ('./Client')
  , Schema    = mongodb.Schema
  , ObjectId  = mongodb.Schema.Types.ObjectId
  ;

var options = require ('./commonOptions') ()
  ;

options.discriminatorKey = 'kind';

var schema = new Schema ({
  /// Client the token was created with.
  client: {type: ObjectId, required: true, ref: Client.modelName, index: true},

  /// Enabled state for the token.
  enabled: {type: Boolean, required: true, default : true},

  /// The access scopes for the token.
  scope: [{type: String}],

  /// Optional origin for binding the token to a host/origin. This is important
  /// with dealing with x-site scripting.
  origin: {type: String}
}, options);

const MODEL_NAME = 'access_token';
const COLLECTION_NAME = 'gatekeeper_access_tokens';

module.exports = mongodb.model (MODEL_NAME, schema, COLLECTION_NAME);
