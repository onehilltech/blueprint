const mongodb = require ('../../../../lib/');

const schema = new mongodb.Schema ({
  first_name: {type: String},

  last_name: {type: String},

  email: {type: String}
});

module.exports = mongodb.model ('user', schema, 'blueprint_users');
