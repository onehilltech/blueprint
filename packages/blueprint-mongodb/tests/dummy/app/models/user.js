const mongodb = require ('../../../../lib/');
const Author  = require ('./author');

const schema = new mongodb.Schema ({
  first_name: {type: String},

  last_name: {type: String},

  email: {type: String},

  // ObjectId that can be populated because there is a ref.
  favorite_author: {type: mongodb.Schema.Types.ObjectId, ref: Author.modelName},

  // ObjectId that cannot be populated because there is no ref.
  random_id: {type: mongodb.Schema.Types.ObjectId},

  // Array of ObjectIds that can be populated.
  blacklist: [{type: mongodb.Schema.Types.ObjectId, ref: Author.modelName}]
});

module.exports = mongodb.model ('user', schema, 'blueprint_users');
