var bcrypt    = require ('bcrypt')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Client = require ('./Client')
  ;

const SALT_WORK_FACTOR = 10;
const DEFAULT_ROLES    = ['user'];

var Schema = blueprint.Schema;

var schema = new Schema ({
  /// Username for the account.
  username : { type: String, required: true, index: true, unique: true},

  /// Encrypted password
  password : { type: String, required: true},

  /// Contact email address for the account.
  email    : { type: String, required: true, index: true, unique: true, trim: true },

  /// The client that created the account.
  created_by : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},

  /// The account is enable.
  enabled  : { type: Boolean, required: true, default: true },

  /// Roles of the user.
  roles    : { type: [String], default: DEFAULT_ROLES},

  /// Verification information for the account.
  verification : {
    /// Date when the account was verified.
    when : { type: Date},

    /// Verification token for the account. If the account has been verified, then
    /// there will be no token.
    token : {
      /// The value of the token.
      value : { type : String},

      /// The date when the verification token expires.
      expires_at : { type : Date}
    }
  },

  /// Push notifications for the account.
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
