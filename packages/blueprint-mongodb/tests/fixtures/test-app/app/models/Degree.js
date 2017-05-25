'use strict';

const mongodb = require ('../../../../../lib')
  , School    = require ('./School')
  , options   = require ('./schemaOptions') ()
  ;

var schema = new mongodb.Schema ({
  degree: {type: String},
  major : {type: String},
  school: {type: mongodb.Schema.Types.ObjectId, ref: School.modelName, required: true}
}, options);

module.exports = mongodb.model ('degree', schema, 'blueprint_degrees');
