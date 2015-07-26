var uid      = require ('uid-safe')
  ;

var Client  = require ('./client')
  , Account = require ('../account')
  ;

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';

function register (mongoose) {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    token         : {type: String, index: true, required: true},
    refresh_token : {type: String, index: true},
    client        : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},
    account       : {type: Schema.Types.ObjectId, ref: Account.modelName},
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
  schema.statics.newUserToken = function (length, client, user, done) {
    var token = uid.sync (length);
    var refreshToken = uid.sync (length);

    var query   = {account : user, client : client};
    var data    = {token : token, refresh_token : refreshToken, enabled : true};
    var options = {upsert : true, new : true};

    this.findOneAndUpdate (query, data, options, done);
  };

  /**
   * Create a new client token and add it to the database.
   *
   * @param length
   * @param client
   * @param scope
   * @param done
   */
  schema.statics.newClientToken = function (length, client, scope, done) {
    var token   = uid.sync (length);
    var query   = {client : client};
    var data    = {token: token, client: client, enabled : true};
    var options = {upsert : true, new : true};

    this.findOneAndUpdate (query, data, options, done);
  };

  /**
   * Refresh an access token.
   *
   * @param length
   * @param client
   * @param refreshToken
   * @param done
   */
  schema.statics.refresh = function (length, client, refreshToken, done) {
    var query = {client : client, refresh_token: refreshToken};
    var data  = {token : uid.sync (length), refresh_token : uid.sync (length)};

    this.findOneAndUpdate (query, data, done);
  };

  return mongoose.model (COLLECTION_NAME, schema);
}

module.exports = exports = register (require ('mongoose'));
exports.register = register;

