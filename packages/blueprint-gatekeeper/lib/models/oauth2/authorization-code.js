var mongoose = require ('mongoose'),
    Client   = require ('./client'),
    User     = require ('../user');

/**
 * Factory method for creating the 'oauth2_client' schema.
 */
function create_schema () {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    code : {type: String, unique: true},
    client : {type: Schema.Types.ObjectId, ref: Client.mdoelName},
    redirect_uri : {type: String, trim: true},
    user : {type: Schema.Types.ObjectId, ref: User.modelName, unique: true},
  });

  return schema;
}

const COLLECTION_NAME = 'oauth2_authorizationcode';
var schema = create_schema ();
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
