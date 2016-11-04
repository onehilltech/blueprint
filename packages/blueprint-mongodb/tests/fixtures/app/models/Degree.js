var mongodb = require ('../../../../lib')
  ;

var schema = new mongodb.Schema ({
  degree: {type: String},
  major : {type: String},
  school: {type: String}
});

module.exports = mongodb.model ('degree', schema, 'blueprint_degrees');
