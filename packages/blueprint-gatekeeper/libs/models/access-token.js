var mongoose = require ('mongoose')
  , Client = require ('./client')
  , Account = require ('./account')
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

const COLLECTION_NAME = 'gatekeeper_accesstoken';
var schema = createSchema ();
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
