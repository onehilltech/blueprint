var mongoose = require ('mongoose')
  , uid      = require ('uid-safe')
  , Client   = require ('./client')
  , Account  = require ('../account')
  ;

var Schema = mongoose.Schema;

var schema = new Schema ({
  token         : {type: String, index: true, required: true},
  refresh_token : {type: String, index: true},
  client        : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},
  account       : {type: Schema.Types.ObjectId, ref: Account.modelName},
  enabled       : {type: Boolean, required: true, default : true}
});

schema.statics.generateAndSave = function (length, client, user, done) {
  var token = uid.sync (length);
  var refreshToken = uid.sync (length);

  var accessToken = new this ({
    token : token,
    refresh_token : refreshToken,
    account : user,
    client : client
  });

  accessToken.save (function (err) {
    return err ? done (err) : done (null, token, refreshToken);
  });
};

schema.statics.newClientToken = function (length, client, scope, done) {
  var token = uid.sync (length);
  var query = {client : client};
  var data  = {token: token, client: client, enabled : true};
  var options = {upsert : true, new : true};

  this.findOneAndUpdate (query, data, options, done);
};

schema.statics.refreshAndSave = function (length, client, refreshToken, done) {
  this.findOne ({client : client, refresh_token: refreshToken}, function (err, at) {
    if (err)
      return done (err);

    // Refresh and save the access token.
    var newToken = at.token = uid.sync (length);
    var newRefreshToken = at.refresh_token = uid.sync (length);

    at.save (function (err) {
      return done (err, newToken, newRefreshToken);
    });
  });
};

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
