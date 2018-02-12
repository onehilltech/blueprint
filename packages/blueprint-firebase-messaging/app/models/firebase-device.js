const blueprint = require ('@onehilltech/blueprint');
const mongodb   = require ('@onehilltech/blueprint-mongodb');
const {TokenGenerator} = require ('@onehilltech/blueprint-gatekeeper');

let deviceToken;

blueprint.messaging.on ('app.init', () => {
  deviceToken = new TokenGenerator ();
});

const {
  Schema: {
    Types: {
      ObjectId
    }
  }
} = mongodb;

const options = {
  toJSON: {
    versionKey: false,
    depopulate: true,
    virtuals: true
  },

  toObject: {
    versionKey: false,
    depopulate: true,
    virtuals: true
  }
};

let schema = new mongodb.Schema({
  /// Instance id for the token.
  device: {type: String, required: true, unique: true, index: true, const: true},

  /// Access token for the device.
  token: {type: String},

  /// User account that owns the token.
  owner: {type: ObjectId, ref: 'account', validation: {optional: true}},
}, options);

schema.virtual ('device_token').get (function () {
  return deviceToken.generateToken ({}, {jwtid: this.id, subject: 'firebase.device'});
});

schema.statics.verifyDeviceToken = function (token, callback) {
  deviceToken.verifyToken (token, {}, callback);
};

module.exports = mongodb.resource ('device', schema, 'firebase_devices');
