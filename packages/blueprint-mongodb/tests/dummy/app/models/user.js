const mongodb = require ('../../../../lib/');
const Author  = require ('./author');

const schema = new mongodb.Schema ({
  first_name: {type: String},
  last_name: {type: String},
  email: {type: String},
  favorite_author: {type: mongodb.Schema.Types.ObjectId, ref: Author.modelName},
});

module.exports = mongodb.model ('user', schema, 'blueprint_users');
