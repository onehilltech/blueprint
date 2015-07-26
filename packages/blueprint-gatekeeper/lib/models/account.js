var bcrypt = require ('bcrypt');

const SALT_WORK_FACTOR = 10;
const DEFAULT_ROLES = ['user'];

function register (mongoose) {
  var Schema = mongoose.Schema;

  var schema = new Schema ({
    username : { type: String, index: true, unique: true, trim: true, required: true },
    password : { type: String },
    email    : { type: String, index: true, unique: true, trim: true, required: true },

    // Access control fields.
    enabled  : { type: Boolean,  default: true },
    roles    : { type: [String], default: DEFAULT_ROLES}
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
   * @param[in]           callback          Callback function
   */
  schema.methods.verifyPassword = function (password, callback) {
    bcrypt.compare (password, this.password, callback);
  };

  schema.statics.authenticate = function (username, password, done) {
    this.findOne ({ username: username }, function (err, account) {
      if (err)
        return done (err);

      if (!account)
        return done (new Error ('Account does not exist'));

      if (account.disabled)
        return done (new Error ('Account is disabled'));

      account.verifyPassword (password, function (err, match) {
        if (err)
          return done (err);

        if (!match)
          return done (new Error ('Invalid password'));

        return done (null, account);
      });
    });
  };

  schema.virtual ('hidden_password').get (function () {
    return new Array (this.password.length).join ('*');
  });

  // Create the user collection, and export it from this module.
  const COLLECTION_NAME = 'gatekeeper_account';
  return mongoose.model (COLLECTION_NAME, schema);
}

// Register schema on the global connection.
module.exports = exports = register (require ('mongoose'));

// Allow schema to be registered on any connection.
exports.register = register;

