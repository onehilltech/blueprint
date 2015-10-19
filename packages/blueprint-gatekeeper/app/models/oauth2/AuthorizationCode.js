var xpression = require ('xpression')
  ;

// We have to manually load the references models since the models
// will not be accessible via <xpression> until all models are loaded.
var Client  = require ('../Client')
  , Account = require ('../Account')
  ;

var Schema = xpression.Schema;

var schema = new Schema ({
  code         : {type: String, unique: true, index : true},
  client       : {type: Schema.Types.ObjectId, ref: Client.modelName},
  redirect_uri : {type: String, trim: true},
  account      : {type: Schema.Types.ObjectId, ref: Account.modelName, unique: true},
});

const COLLECTION_NAME = 'gatekeeper_oauth2_authorizationcode';
module.exports = exports = xpression.model (COLLECTION_NAME, schema);
