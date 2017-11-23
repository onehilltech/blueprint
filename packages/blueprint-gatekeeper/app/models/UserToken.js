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
      const options = { jwtid: this.id };

      tokenGenerator.generateToken (payload, options, callback);
    }.bind (this),

    refresh_token: function (callback) {
      if (!this.refresh_token)
        return callback (null);

      const payload = {  };
      const options = { jwtid: this.refresh_token.toString () };

      tokenGenerator.generateToken (payload, options, callback);
    }.bind (this)
  }, callback);
};

schema.methods.serializeSync = function () {
  let accessToken = {
    access_token: tokenGenerator.generateToken ({ scope: this.scope }, { jwtid: this.id })
  };

  if (this.refresh_token)
    accessToken.refresh_token = tokenGenerator.generateToken ({ }, { jwtid: this.refresh_token.toString () })

  return accessToken;
};

module.exports = AccessToken.discriminator ('user_token', schema);
