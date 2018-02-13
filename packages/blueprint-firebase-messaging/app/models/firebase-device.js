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
  /// The device instance id.
  device: {type: String, required: true, unique: true, index: true, const: true},

  /// The client the device is associated with.
  client: {type: ObjectId, ref: 'client', required: true, validation: {optional: true}},

  /// Access token for the device. We use the device access token in our
  /// request we consider the device token from Firebase to be unsafe to
  /// authenticate our requests.
  token: {type: String},

  /// The user account associated with the account.
  user: {type: ObjectId, ref: 'account', validation: {optional: true}},
}, options);

schema.virtual ('device_token').get (function () {
  return deviceToken.generateToken ({}, {jwtid: this.id, subject: 'firebase.device'});
});

schema.statics.verifyDeviceToken = function (token, callback) {
  deviceToken.verifyToken (token, {}, callback);
};

module.exports = mongodb.resource ('device', schema, 'firebase_devices');
