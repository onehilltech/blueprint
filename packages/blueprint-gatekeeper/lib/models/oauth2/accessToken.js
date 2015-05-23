var mongoose = require ('mongoose')
  , uid      = require ('uid-safe')
  , Client   = require ('./client')
  , Account  = require ('../account')
  ;

/**
 * Factory function for creating the 'oauth2_accesstoken' schema.
 */
function createSchema () {
  var Schema = mongoose.Schema;
  
  var schema = new Schema ({
    token : {type: String, index: true, unique: true},
    refresh_token : {type: String, index: true, unique: true},
    account : {type: Schema.Types.ObjectId, ref: Account.modelName},
    client : {type: Schema.Types.ObjectId, ref: Client.modelName},
    disabled : {type: Boolean, default : false}
  });

  return schema;
}

var schema = createSchema ();


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

schema.methods.refreshAndSave = function (length, done) {
  var token = this.token = uid.sync (length);
  var refreshToken = this.refresh_token = uid.sync (length);

  this.save (function (err) {
    return done (err, token, refreshToken);
  });
}

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
