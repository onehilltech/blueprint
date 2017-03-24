'use strict';

const mongodb   = require ('@onehilltech/blueprint-mongodb')
  , async       = require ('async')
  , Schema      = mongodb.Schema
  , ObjectId    = mongodb.Schema.Types.ObjectId
  , AccessToken = require ('./AccessToken')
  , Account     = require ('./Account')
  ;

var options     = require ('./commonOptions') ()
  ;

options.discriminatorKey = AccessToken.schema.options.discriminatorKey;

var schema = new Schema ({
  /// Account that owns the token.
  account: {type: ObjectId, ref: Account.modelName, index: true},

  /// Optional refresh token for the user.
  refresh_token: {type: ObjectId, index: true, unique: true}
}, options);

schema.methods.serialize = function (serializer, callback) {
  async.parallel ({
    access_token: function (callback) {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      serializer.generateToken (payload, options, callback);
    }.bind (this),

    refresh_token: function (callback) {
      const payload = {  };
      const options = { jwtid: this.refresh_token.toString () };

      serializer.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

module.exports = AccessToken.discriminator ('user_token', schema);
