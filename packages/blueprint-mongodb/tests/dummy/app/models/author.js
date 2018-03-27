const mongodb = require ('../../../../lib');

const schema = new mongodb.Schema ({
  name: {type: String}
});

module.exports = mongodb.resource ('author', schema, 'blueprint_authors');
