var mongoose = require ('mongoose'),
    bcrypt   = require ('bcrypt');

var SALT_WORK_FACTOR = 10;
var Schema = mongoose.Schema;

var schema = new Schema ({
  username : { type: String, index: true, unique: true },
  password : { type: String, trim: true },
  disabled : { type: Boolean, default: false }
});

/**
 * Hash the user's password before saving it to the database. This will
 * help protect the password if the database is somehow hacked.
 */
schema.pre ('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified ('password')) 
    return next ();

  // generate a salt
  bcrypt.genSalt (SALT_WORK_FACTOR, function (err, salt) {
    if (err) 
      return next (err);

    // hash the password along with our new salt
    bcrypt.hash (user.password, salt, function (err, hash) {
      if (err) 
        return next (err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next ();
    });
  });
});

/**
 * Verify the password provided by the user. The \@ password should
 * not be encrpyted. This method will perform the hash of the password
 * to verify its correctness.
 *
 * @param[in]           password          The user's password
 */
schema.methods.verifyPassword = function (password, callback) {
  bcrypt.compare (password, this.password, callback);
};

// Create the user collection, and export it from this module.
const COLLECTION_NAME = 'gatekeeper_account';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
