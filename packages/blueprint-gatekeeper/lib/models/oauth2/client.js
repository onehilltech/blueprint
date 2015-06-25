var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  ;

var schema = new Schema ({
  name         : {type: String, required: true, trim: true },
  email        : {type: String, required: true, trim: true },
  secret       : {type: String, required: true },
  redirect_uri : {type: String, required: true, trim: true },
  enabled      : {type: Boolean, default: true }
});

const COLLECTION_NAME = 'gatekeeper_oauth2_client';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
