var uid       = require ('uid-safe')
  , blueprint = require ('@onehilltech/blueprint')
  ;

// We have to manually load the references models since the models
// will not be accessible via <blueprint> until all models are loaded.
var Client  = require ('../Client')
  , Account = require ('../Account')
  ;

var Schema = blueprint.Schema;

var schema = new Schema ({
  client: {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},
  account: {type: Schema.Types.ObjectId, ref: Account.modelName},
  enabled: {type: Boolean, required: true, default : true},
  refresh_token: {type: Schema.Types.ObjectId, index: true},
  expires_at: {type: Date}
});

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

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
