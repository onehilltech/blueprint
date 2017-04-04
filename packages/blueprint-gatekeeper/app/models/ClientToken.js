'use strict';

const mongodb   = require ('@onehilltech/blueprint-mongodb')
  , blueprint   = require ('@onehilltech/blueprint')
  , async       = require ('async')
  , AccessToken = require ('./AccessToken')
  , Schema      = mongodb.Schema
  , serializer  = require ('../middleware/serializers') (blueprint.app.configs.gatekeeper.token)
  ;

var options     = require ('./commonOptions') ()
  ;

options.discriminatorKey = AccessToken.schema.options.discriminatorKey;

var schema = new Schema ({ }, options);

schema.methods.serialize = function (callback) {
  async.series ({
    access_token: function (callback) {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      serializer.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

module.exports = AccessToken.discriminator ('client_token', schema);
