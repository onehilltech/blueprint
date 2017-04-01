'use strict';

var mongodb = require ('../../../../../lib')
  , Person  = require ('./Person')
  , options = require ('./schemaOptions') ()
  ;

var schema = new mongodb.Schema ({
  person: {type: mongodb.Schema.Types.ObjectId, ref: Person.modelName},
  friend: {type: mongodb.Schema.Types.ObjectId, ref: Person.modelName}
}, options);

module.exports = mongodb.resource ('friend', schema, 'blueprint_friends');
