var mongoose = require ('mongoose');

/**
 * Factory function for creating the 'oauth2_client' schema.
 */
function create_schema () {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    name : {type: String, trim: true },
    secret : {type: String},
    redirect_uri : {type: String, required: true},
    disabled : {type: Boolean, default: false},
    direct_login : {type: Boolean, default: false}
  });

  return schema;  
}

const COLLECTION_NAME = 'oauth2_client';
var schema = create_schema ();
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
