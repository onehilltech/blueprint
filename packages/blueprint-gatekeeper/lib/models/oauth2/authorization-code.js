var mongoose = require ('mongoose');
var Client = require ('./client');
var Account = require ('../account');

/**
 * Factory method for creating the 'oauth2_client' schema.
 */
function createSchema () {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    code : {type: String, unique: true},
    client : {type: Schema.Types.ObjectId, ref: Client.mdoelName},
    redirect_uri : {type: String, trim: true},
    account : {type: Schema.Types.ObjectId, ref: Account.modelName, unique: true},
  });

  return schema;
}

const COLLECTION_NAME = 'oauth2_authorizationcode';
var schema = createSchema ();
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
