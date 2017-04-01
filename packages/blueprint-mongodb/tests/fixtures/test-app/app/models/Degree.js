'use strict';

const mongodb = require ('../../../../../lib')
  , options   = require ('./schemaOptions') ()
  ;

var schema = new mongodb.Schema ({
  degree: {type: String},
  major : {type: String},
  school: {type: String}
}, options);

module.exports = mongodb.model ('degree', schema, 'blueprint_degrees');
