'use strict';

var mongodb = require ('../../../../lib')
  , Degree  = require ('./Degree')
  , options = require ('./schemaOptions') ()
  ;

var schema = new mongodb.Schema ({
  first_name: {type: String, required: true, default: 'New'},
  middle_name: {type: String},
  last_name: {type: String, required: true, default: 'User'},
  age: {type: Number, required: true, validation: {kind: 'Int'}},
  gender: {type: String, required: true, enum: ['Female', 'Male']},
  dob: {type: Date, required: true},

  address: {
    street: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    zipcode: {type: String, required: true}
  },

  education: {type: mongodb.Schema.Types.ObjectId, ref: Degree.modelName},
  degrees: [{type: mongodb.Schema.Types.ObjectId, ref: Degree.modelName}]
}, options);

module.exports = mongodb.resource ('person', schema, 'blueprint_persons');
