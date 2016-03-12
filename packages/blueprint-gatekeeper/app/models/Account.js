var bcrypt    = require ('bcrypt')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Client = require ('./Client')
  ;

const SALT_WORK_FACTOR = 10;

var Schema = blueprint.Schema;

var schema = new Schema ({
  /**
   * Access credentials for the account. This subdocument contains the
   * account username and password, as well as any access roles for the
   * user, such as admin.
   */

  access_credentials : {
    /// Username for the account.
    username : { type: String, required: true, index: true, unique: true},

    /// Encrypted password
    password : { type: String, required: true},

    /// Access roles for the account.
    roles : { type: [String]}
  },

  /**
   * Basic profile information for the account. We only care about the
   * name of the user and their email address. This allows us to display
   * information about the user.
   */

  profile : {
    /// Contact email address for the account.
    email : { type: String, required: true, trim: true },

    /// The first name of the account holder.
    first_name : { type: String, trim : true},

    /// The middle name of the account holder.
    middle_name : { type: String, trim : true},

    /// The last name of the account holder.
    last_name : { type: String, trim : true},

    /// Profile image of the user, which should be a url.
    image : { type: String, trim: true }
  },

  /**
   * Internal housekeeping information. This is only use by the service
   * to manage the account. This includes information such as what client
   * created the account, and is the account enabled.
   *
   */

  internal_use : {
    /// The client that created the account.
    created_by : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},

    /// Enabled state for the account.
    enabled : { type: Boolean, required: true, default: true },

    /**
     * Verification information for the account. An account can be created, but it
     * may not be verified. A service has the option of allowing unverified accounts
     * to access its resource, or deny access until the account has been verified.
     */

    verification : {
      /// Date when the account was verified.
      date : { type: Date },

      /// Verification token for the account. If the account has been verified, then
      /// there will be no token.
      token : {
        /// The value of the token.
        value : { type : String},

        /// The date when the verification token expires.
        expires_at : { type : Date}
      }
    }
  },

  /**
   * Push notifications for the account. Push notifications allow a service to
   * send real-time updates to the client.
   */

  notifications : {
    /// Token information for Google Cloud Messaging.
    gcm : { type : String },

    /// Token information for Apple Push Notification Services.
    ios : { type : String }
  }
});

/**
 * Hash the user's password before saving it to the database. This will
 * help protect the password if the database is somehow hacked.
 */
schema.pre ('save', function (next) {
  var account = this;

  // only hash the password if it has been modified (or is new)
  if (!account.isModified ('access_credentials.password'))
    return next ();

  // generate a salt
  bcrypt.genSalt (SALT_WORK_FACTOR, function (err, salt) {
    if (err)
      return next (err);

    // hash the password along with our new salt
    bcrypt.hash (account.access_credentials.password, salt, function (err, hash) {
      if (err)
        return next (err);

      // override the clear text password with the hashed one
      account.access_credentials.password = hash;
      next ();
    });
  });
});

/**
 * Get the roles for the account.
 *
 * @returns {schema.access_credentials.roles|{type}|Array}
 */
schema.methods.getRoles = function () {
  return this.access_credentials.roles || [];
};

/**
 * Verify the password provided by the user. The \@ password should
 * not be encrpyted. This method will perform the hash of the password
 * to verify its correctness.
 *
 * @param[in]           password          The user's password
 * @param[in]           callback          Callback function
 */
schema.methods.verifyPassword = function (password, callback) {
  bcrypt.compare (password, this.access_credentials.password, callback);
};

/**
 * Test if the account has been verified.
 *
 * @returns {boolean}
 */
schema.methods.isVerified = function () {
  return this.internal_use.verification.date !== undefined;
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
schema.methods.verify = function (token, callback) {
  var verification = this.internal_use.verification;

  if (verification.token.value !== token)
    return callback (new Error ('Token is does match'));

  verification.date = Date.now ();
  this.save (callback);
};

/**
 * Test if the account is enabled.
 *
 * @returns {Boolean}
 */
schema.methods.isEnabled = function () {
  return this.internal_use.enabled === true;
};

schema.statics.authenticate = function (username, password, done) {
  this.findOne ({ username: username }, function (err, account) {
    if (err)
      return done (err);

    if (!account)
      return done (new Error ('Account does not exist'));

    if (!account.enabled)
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

const COLLECTION_NAME  = 'gatekeeper_account';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
