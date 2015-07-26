var Client  = require ('./client')
  , Account = require ('../account');

const COLLECTION_NAME = 'gatekeeper_oauth2_authorizationcode';

function register (mongoose) {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    code         : {type: String, unique: true, index : true},
    client       : {type: Schema.Types.ObjectId, ref: Client.mdoelName},
    redirect_uri : {type: String, trim: true},
    account      : {type: Schema.Types.ObjectId, ref: Account.modelName, unique: true},
  });

  return mongoose.model (COLLECTION_NAME, schema);
}

module.exports = exports = register (require ('mongoose'));
exports.register = register;
