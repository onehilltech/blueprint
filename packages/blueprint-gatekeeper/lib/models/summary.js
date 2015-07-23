var mongoose = require ('mongoose')
  , Schema = mongoose.Schema
  ;

const COLLECTION_NAME = 'gatekeeper_summary';

var schema = new Schema ({
  oauth2 : {
    clients : { type : Number, default : 0},
    codes   : { type : Number, default : 0},
    tokens  : { type : Number, default : 0}
  }
});

var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
