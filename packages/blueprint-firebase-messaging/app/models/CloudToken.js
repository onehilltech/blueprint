'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , mongodb     = require ('@onehilltech/blueprint-mongodb')
  , Schema      = mongodb.Schema
  , ObjectId    = Schema.Types.ObjectId
  , Account     = blueprint ('model://@onehilltech/gatekeeper:Account')
  ;

const options = {
  toJSON: {
    versionKey: false,
    depopulate: true
  },

  toObject: {
    versionKey: false,
    depopulate: true
  }
};

var schema = new Schema({
  /// Instance id for the token.
  device: {type: String, required: true, unique: true, index: true, const: true},

  /// User account that owns the token.
  owner: {type: ObjectId, required: true, ref: Account.modelName, validation: {optional: true} },

  /// Access token for the device.
  token: {type: String, required: true}
}, options);

module.exports = mongodb.resource ('cloud_token', schema, 'blueprint_cloud_tokens');
