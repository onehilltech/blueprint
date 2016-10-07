var blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  ;

var Schema  = mongodb.Schema
  , Account = blueprint.app.modules ['@onehilltech/gatekeeper'].models.Account
  ;

var schema = new Schema({
  /// Instance id for the token.
  device: {type: String, required: true, unique: true, index: true},

  /// User account that owns the token.
  owner: {type: Schema.Types.ObjectId, required: true, ref: Account.modelName, validation: {optional: true}},

  /// Access token for the device.
  token: {type: String, required: true}
});

const COLLECTION_NAME = 'blueprint_cloud_token';
module.exports = mongodb.model (COLLECTION_NAME, schema);
