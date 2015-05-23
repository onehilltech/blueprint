var mongoose = require ('mongoose')
  , Client   = require ('./client')
  , Account  = require ('../account')
  ;

function getRandomInt (min, max) {
  return Math.floor (Math.random () * (max - min + 1)) + min;
}

function generateToken (len) {
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push (chars[getRandomInt (0, charlen - 1)]);
  }

  return buf.join ('');
}

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
  var token = generateToken (length);
  var refreshToken = generateToken (length);

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
  var token = this.token = generateToken (length);
  var refreshToken = this.refresh_token = generateToken (length);

  this.save (function (err) {
    return done (err, token, refreshToken);
  });
}

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
