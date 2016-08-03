var uid       = require ('uid-safe')
  , blueprint = require ('@onehilltech/blueprint')
  , async     = require ('async')
  ;

// We have to manually load the references models since the models
// will not be accessible via <blueprint> until all models are loaded.
var Client  = require ('../Client')
  , Account = require ('../Account')
  ;

const DEFAULT_TOKEN_LENGTH = 128;

var Schema = blueprint.Schema;

var schema = new Schema ({
  token         : {type: String, index: true, required: true},
  refresh_token : {type: String, index: true},
  client        : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},
  account       : {type: Schema.Types.ObjectId, ref: Account.modelName},
  expires_at    : {type: Date, required: true, default: Date.now},
  enabled       : {type: Boolean, required: true, default : true}
});

/**
 * Create a new user token, and save the token to the database.
 *
 * @param length
 * @param client
 * @param user
 * @param done
 */
schema.statics.createUserToken = function (client, user, done) {
  var self = this;
  var opts = { account: user, client: client, enabled: true };

  async.waterfall ([
    function (callback) {
      uid (DEFAULT_TOKEN_LENGTH, callback);
    },
    function (token, callback) {
      opts.token = token;
      uid (DEFAULT_TOKEN_LENGTH, callback);
    },
    function (token, callback) {
      opts.refresh_token = token;
      callback ();
    },
    function (callback) { self.create (opts, callback); }
  ], done);
};

/**
 * Generate a token string.
 *
 * @param callback
 * @returns {Promise}
 */
schema.statics.generateTokenString = function (callback) {
  return uid (DEFAULT_TOKEN_LENGTH, callback);
};

/**
 * Refresh an access token.
 *
 * @param length
 * @param client
 * @param refreshToken
 * @param done
 */
schema.statics.refresh = function (client, refreshToken, done) {
  var query = {client : client, refresh_token: refreshToken};
  var data  = {token : uid.sync (DEFAULT_TOKEN_LENGTH), refresh_token : uid.sync (DEFAULT_TOKEN_LENGTH)};

  this.findOneAndUpdate (query, data, done);
};

/**
 * Test if the access token is for an account.
 *
 * @returns {boolean}
 */
schema.methods.isAccountToken = function () {
  return this.account !== undefined;
};

/**
 * Test if the access token is for a client.
 *
 * @returns {boolean}
 */
schema.methods.isClientToken = function () {
  return this.account === undefined;
};

/**
 * Retrieve how many seconds the access token expires in. This is calculated based
 * on the difference of the current time and when the access token actually expires.
 */
schema.virtual ('expires_in').get (function () {
  return 3600;
});

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
