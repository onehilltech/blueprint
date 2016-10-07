var mongodb = require ('../../../../lib')
  ;

var education = new mongodb.Schema ({
  degree: {type: String},
  school: {type: String},
  graduation: {type: Number}
});

var schema = new mongodb.Schema ({
  first_name: {type: String, required: true, default: 'New'},
  middle_name: {type: String},
  last_name: {type: String, required: true, default: 'User'},
  age: {type: Number, required: true, validation: {kind: 'Int'}},
  sex: {type: String, required: true, enum: ['Female', 'Male']},
  dob: {type: Date, required: true},

  address: {
    street: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    zipcode: {type: Number, required: true}
  },

  books: [{type: String, ref: 'person', index: true, required: true}],
});

module.exports = mongodb.model ('person', schema);
