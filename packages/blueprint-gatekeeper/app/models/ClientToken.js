'use strict';

const mongodb   = require ('@onehilltech/blueprint-mongodb')
  , async       = require ('async')
  , AccessToken = require ('./AccessToken')
  , Schema      = mongodb.Schema
  ;

var options     = require ('./commonOptions') ()
  ;

options.discriminatorKey = AccessToken.schema.options.discriminatorKey;

var schema = new Schema ({ }, options);

schema.methods.serialize = function (serializer, callback) {
  async.series ({
    access_token: function (callback) {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      serializer.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

module.exports = AccessToken.discriminator ('client_token', schema);
