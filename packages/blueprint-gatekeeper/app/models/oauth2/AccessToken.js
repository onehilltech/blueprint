'use strict';

var mongodb = require ('@onehilltech/blueprint-mongodb')
  , options = require ('../commonOptions') ()
  , Client  = require ('../Client')
  , Account = require ('../Account')
  ;

var Schema = mongodb.Schema;

var schema = new Schema ({
  /// Client the token was created with.
  client: {type: mongodb.Schema.Types.ObjectId, required: true, ref: Client.modelName, index: true},

  /// Account the token is attached.
  account: {type: mongodb.Schema.Types.ObjectId, ref: Account.modelName, index: true},

  /// Enabled state for the token.
  enabled: {type: Boolean, required: true, default : true},

  /// Refresh token.
  refresh_token: {type: Schema.Types.ObjectId, index: true},

  /// The access scopes for the token.
  scopes: [{type: String}]
}, options);

/**
 * Test if the access token is for an account.
 *
 * @returns {boolean}
 */
schema.methods.isAccountToken = function () {
  return this.account !== undefined;
};

/**
 * Test if the access token is for a client.
 *
 * @returns {boolean}
 */
schema.methods.isClientToken = function () {
  return this.account === undefined;
};

const MODEL_NAME = 'access_token';
const COLLECTION_NAME = 'gatekeeper_oauth2_access_tokens';

module.exports = mongodb.model (MODEL_NAME, schema, COLLECTION_NAME);
