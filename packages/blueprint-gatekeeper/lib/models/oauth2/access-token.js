var mongoose = require ('mongoose'),
    Client   = require ('./client'),
    User     = require ('../user');

/**
 * Factory function for creating the 'oauth2_accesstoken' schema.
 */
function create_schema () {
  var Schema = mongoose.Schema;
  
  var schema = new Schema ({
    token : {type: String, index: true, unique: true},
    refresh_token : {type: String, index: true, unique: true},
    user : {type: Schema.Types.ObjectId, ref: User.modelName},
    client : {type: Schema.Types.ObjectId, ref: Client.modelName},
    disabled : {type: Boolean, default : false}
  });

  return schema;
}

const COLLECTION_NAME = 'oauth2_accesstoken';
var schema = create_schema ();
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
