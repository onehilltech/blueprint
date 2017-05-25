'use strict';

var mongodb = require ('../../../../../lib')
  , options = require ('./schemaOptions') ()
  ;

var schema = new mongodb.Schema ({
  name: {type: String, required: true}
}, options);

module.exports = mongodb.resource ('school', schema, 'blueprint_schools');
