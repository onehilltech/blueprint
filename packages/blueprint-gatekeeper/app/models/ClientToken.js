'use strict';

const mongodb = require ('@onehilltech/blueprint-mongodb')
  , async     = require ('async')
  , Schema    = mongodb.Schema
  , AccessToken          = require ('./AccessToken')
  , AccessTokenGenerator = require ('../utils/access-token-generator')
;

let options = require ('./commonOptions') ()
;

const tokenGenerator = new AccessTokenGenerator ();
options.discriminatorKey = AccessToken.schema.options.discriminatorKey;

let schema = new Schema ({ }, options);

schema.methods.serialize = function (callback) {
  async.series ({
    access_token: function (callback) {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      if (this.origin)
        options.audience = this.origin;

      tokenGenerator.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

schema.methods.serializeSync = function () {
  const payload = { scope: this.scope };
  const options = { jwtid: this.id };

  if (this.origin)
    options.audience = this.origin;

  const access_token = tokenGenerator.generateToken (payload, options);

  return {access_token};
};

module.exports = AccessToken.discriminator ('client_token', schema);
