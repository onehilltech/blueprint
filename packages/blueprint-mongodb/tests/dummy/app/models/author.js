const mongodb = require ('../../../../lib');

const schema = new mongodb.Schema ({
  name: {type: String, unique: true}
});

module.exports = mongodb.resource ('author', schema, 'blueprint_authors');
