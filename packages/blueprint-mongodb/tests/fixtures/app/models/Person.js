var mongodb = require ('../../../../lib')
  ;

var schema = new mongodb.Schema ({
  first_name: {type: String, required: true, default: 'New'},
  middle_name: {type: String},
  last_name: {type: String, required: true, default: 'User'},
  age: {type: Number, required: true, validation: {kind: 'Int'}},
  sex: {type: String, required: true, enum: ['Female', 'Male']},
  dob: {type: Date, required: true}
});

module.exports = mongodb.model ('person', schema);
