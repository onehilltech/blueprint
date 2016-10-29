var mongodb = require ('../../../../lib')
  ;

var schema = new mongodb.Schema ({
  degree: {type: String},
  school: {type: String},
  graduation: {type: Number}
});

module.exports = mongodb.model ('degree', schema);
