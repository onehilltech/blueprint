'use strict';

var bcrypt   = require ('bcrypt')
  , mongodb  = require ('@onehilltech/blueprint-mongodb')
  , async    = require ('async')
  , ObjectId = mongodb.Schema.Types.ObjectId
  , options  = require ('./commonOptions') ()
  ;

var Client = require ('./Client')
  ;

/**
 * The default transformation always removes the password from the
 * account. This ensures we do not leak the password.
 *
 * @param doc
 * @param ret
 */
function transform (doc, ret) {
  delete ret.password;
}

options.toJSON.transform = options.toObject.transform = transform;

const SALT_WORK_FACTOR = 10;

var Schema = mongodb.Schema;

var schema = new Schema ({
  /// Username for the account.
  username: { type: String, required: true, unique: true, index: true },

  /// Encrypted password
  password: { type: String, required: true, hidden: true},

  /// Contact email address for the account.
  email: { type: String, required: true, unique: true, trim: true},

  /// The client that created the account.
  created_by: {type: ObjectId, required: true, ref: Client.modelName, index: true, validation: {optional: true}, const: true},

  /// Enabled state for the account.
  enabled: { type: Boolean, required: true, default: true },

  /// The default scope for the account. This is applied to the access
  /// token for the account.
  scope: {type: [String], default: []},
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

  async.waterfall ([
    function (callback) {
      bcrypt.genSalt (SALT_WORK_FACTOR, callback);
    },

    function (salt, callback) {
      bcrypt.hash (account.password, salt, callback);
    },

    function (hash, callback) {
      account.password = hash;
      return callback (null);
    }
  ], next);
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
