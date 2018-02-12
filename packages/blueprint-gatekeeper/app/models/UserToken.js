const mongodb   = require ('@onehilltech/blueprint-mongodb')
  , async       = require ('async')
  , Schema      = mongodb.Schema
  , ObjectId    = mongodb.Schema.Types.ObjectId
  , AccessToken = require ('./AccessToken')
  , Account     = require ('./Account')
  , AccessTokenGenerator = require ('../utils/access-token-generator')
;

let options     = require ('./commonOptions') ()
;

const tokenGenerator = new AccessTokenGenerator ();
options.discriminatorKey = AccessToken.schema.options.discriminatorKey;

let schema = new Schema ({
  /// Account that owns the token.
  account: {type: ObjectId, ref: Account.modelName, index: true},

  /// Optional refresh token for the user.
  refresh_token: {type: ObjectId, index: true, unique: true, sparse: true}
}, options);

schema.methods.serialize = function (callback) {
  async.parallel ({
    access_token: function (callback) {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id, audience: this.origin };

      tokenGenerator.generateToken (payload, options, callback);
    }.bind (this),

    refresh_token: function (callback) {
      if (!this.refresh_token)
        return callback (null);

      const payload = {  };
      const options = { jwtid: this.refresh_token.toString () };

      if (this.origin)
        options.audience = this.origin;

      tokenGenerator.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

schema.methods.serializeSync = function () {
  // Generate the access token.
  let options = {jwtid: this.id};

  if (this.origin)
    options.audience = this.origin;

  let access_token = tokenGenerator.generateToken ({ scope: this.scope }, options);

  let accessToken = { access_token };

  // Include a refresh token is the access token has a refresh token.

  if (this.refresh_token) {
    options = {jwtid: this.refresh_token.toString ()};

    if (this.origin)
      option.audience = this.origin;

    accessToken.refresh_token = tokenGenerator.generateToken ({}, options);
  }

  return accessToken;
};

module.exports = AccessToken.discriminator ('user_token', schema);
