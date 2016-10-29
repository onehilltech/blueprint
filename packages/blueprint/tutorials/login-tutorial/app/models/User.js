'use strict';

var mongodb = require ('@onehilltech/blueprint-mongodb')
  ;

var schema = new mongodb.Schema({
  username: {type: String, required: true, trim: true},
  password: {type: String, required: true}
});

// The password should be encrypted and stored in the database.

schema.methods.verifyPassword = function (password) {
  return this.password === password;
};

module.exports = mongodb.model ('tutorial_users', schema);
