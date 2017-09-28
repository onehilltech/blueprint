'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , mongodb     = require ('@onehilltech/blueprint-mongodb')
  , Schema      = mongodb.Schema
  , ObjectId    = Schema.Types.ObjectId
  , Account     = blueprint ('model://@onehilltech/blueprint-gatekeeper:Account')
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

let schema = new Schema({
  /// Instance id for the token.
  device: {type: String, required: true, unique: true, index: true, const: true},

  /// Access token for the device.
  token: {type: String, required: true},

  /// User account that owns the token.
  owner: {type: ObjectId, ref: Account.modelName, validation: {optional: true}}
}, options);

module.exports = mongodb.resource ('cloud_token', schema, 'cloud_tokens');
