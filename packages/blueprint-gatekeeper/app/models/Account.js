'use strict';

var bcrypt  = require ('bcrypt')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , options = require ('./commonOptions') ()
  ;

var Client = require ('./Client')
  ;

const SALT_WORK_FACTOR = 10;

var Schema = mongodb.Schema;

var schema = new Schema ({
  /**
   * Access credentials for the account. This subdocument contains the
   * account username and password, as well as any access roles for the
   * user, such as admin.
   */

  /// Contact email address for the account.
  email: { type: String, required: true, unique: true, trim: true },

  /// Username for the account.
  username: { type: String, required: true, unique: true, index: true },

  /// Encrypted password
  password: { type: String, required: true},

  /**
   * Internal housekeeping information. This is only use by the service
   * to manage the account. This includes information such as what client
   * created the account, and is the account enabled.
   *
   */

  /// The client that created the account.
  created_by: {type: mongodb.Schema.Types.ObjectId, required: true, ref: Client.modelName, index: true, validation: {optional: true}},

  /// Enabled state for the account.
  enabled: { type: Boolean, required: true, default: true },

  /// The default scope for the account. This is applied to the access
  /// token for the account.
  scope: {type: [String], default: []},

  /**
   * Activation information for the account. An account can be created, but it
   * may not be activated. A service has the option of allowing unactivated accounts
   * to access its resource, or deny access until the account has been verified.
   */
  activation : {
    /// The account requires activation.
    required: { type: Boolean, required: true, default: false },

    /// Verification token for the account.
    token : { type : String },

    /// Date when the account was activated.
    date : { type: Date }
  },

  /// Metadata for the account. This allows third-party services/libraries to
  /// associate custom data with the account.
  metadata : { type: Schema.Types.Mixed, default: {} }
}, options);

/**
 * Hash the user's password before saving it to the database. This will
 * help protect the password if the database is somehow hacked.
 */
schema.pre ('save', function (next) {
  // only hash the password if it has been modified (or is new)
  if (!this.isModified ('password'))
    return next ();

  var account = this;

  // generate a salt
  bcrypt.genSalt (SALT_WORK_FACTOR, function (err, salt) {
    if (err)
      return next (err);

    // hash the password along with our new salt
    bcrypt.hash (account.password, salt, function (err, hash) {
      if (err)
        return next (err);

      // override the clear text password with the hashed one
      account.password = hash;
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

/**
 * Test if the account has been activated.
 *
 * @returns {boolean}
 */
schema.methods.isActivated = function () {
  return !this.activation.required || this.activation.date !== undefined;
};

/**
 * Test if the activiation token has expired.
 *
 * @returns {boolean}
 */
schema.methods.isVerificationTokenExpired = function () {
  var currTime = Date.now ();
  var expiration = this.internal_use.verification.token.expires_at;

  return expiration.getTime () < currTime;
};

/**
 * Verify the account. It is assume the account has not been verify when this
 * method is invoked.
 */
schema.methods.activate = function (token, callback) {
  if (this.activation.token !== token)
    return callback (new Error ('Invalid token'));

  this.activation.date = Date.now ();
  this.save (callback);
};

/**
 * Authenticate the username and password.
 *
 * @param username
 * @param password
 * @param done
 */
schema.statics.authenticate = function (username, password, done) {
  this.findOne ({ username: username }, function (err, account) {
    if (err) return done (err);
    if (!account) return done (new Error ('Account does not exist'));
    if (!account.enabled) return done (new Error ('Account is disabled'));

    account.verifyPassword (password, function (err, match) {
      if (err) return done (err);
      if (!match) return done (new Error ('Invalid password'));
      return done (null, account);
    });
  });
};

const MODEL_NAME = 'account';
const COLLECTION_NAME  = 'gatekeeper_accounts';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
