/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const bcrypt  = require ('bcrypt');
const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema: { Types: { refersTo }}} = mongodb;

const { gatekeeper } = require ('@onehilltech/blueprint').app.configs;
const { isEmail } = require ('validator');

const options = require ('./-common-options') ();
options.softDelete = true;

const SALT_WORK_FACTOR = 10;

const {
  /// The username is the same as the email address.
  usernameIsEmail = false,

  /// The account should be verified before usage.
  verificationRequired = false
} = gatekeeper;

let definition = {
  /// Username for the account.
  username: { type: String, required: true, unique: true, index: true },

  /// Encrypted password
  password: { type: String, required: true, hidden: true},

  /// Contact email address for the account.
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, validate: [isEmail, 'Not a valid email address.']},

  /// Enabled state for the account.
  enabled: { type: Boolean, required: true, default: true },

  /// The default scope for the account. This is applied to the access
  /// token for the account.
  scope: {type: [String], default: []},

  verification: {
    /// The account must be verified.
    required: { type: Boolean, required: true, default: verificationRequired },

    /// The date of the verification.
    date: { type: Date },

    /// The ip-address where the verification was initiated.
    ip_address: { type: String },

    /// Id of the last email message sent regarding account verification.
    last_email: refersTo ('email'),

    /// The date the last email message was sent.
    last_email_date: { type: Date },
  }
};

if (usernameIsEmail) {
  // The username is an email address. Transform to the email address to
  // lower case, and validate the string is an email address.
  definition.username.lowercase = true;
  definition.username.validate = [isEmail, 'Not a valid email address.']
}

let schema = new mongodb.Schema (definition, options);

/**
 * Hash the user's password before saving it to the database. This will
 * help protect the password if the database is somehow hacked.
 */
schema.pre ('save', function () {
  // only hash the password if it has been modified (or is new)
  if (!this.isModified ('password'))
    return Promise.resolve ();

  return bcrypt.hash (this.password, SALT_WORK_FACTOR)
    .then (hash => {
      this.password = hash
    })
});

/**
 * Verify the password provided by the user. The \@ password should not be
 * encrypted. This method will perform the hash of the password to verify its
 * correctness.
 *
 * @param           password          The user's password
 */
schema.methods.verifyPassword = function (password) {
  return bcrypt.compare (password, this.password);
};

schema.methods.verifyPasswordSync = function (password) {
  return bcrypt.compareSync (password, this.password);
};

/**
 * Test if the account is verified.
 */
schema.virtual ('verified').get (function () {
  return !this.verification || !this.verification.required || !!this.verification.date;
});

/**
 * Get the client id, which is an alias for created_by.
 */
schema.virtual ('client_id').get (function () {
  return this.created_by;
});

/**
 * Authenticate the username and password.
 *
 * @param username
 * @param password
 */
schema.statics.authenticate = function (username, password) {
  return this.findOne ({ username: username }).then (account => {
    if (!account)
      return Promise.reject (new Error ('The account does not exist.'));

    if (!account.enabled)
      return Promise.reject (new Error ('The account is disabled.'));

    return account.verifyPassword (password).then (match => {
      if (!match)
        return Promise.reject (new Error ('The password is invalid.'));

      return account;
    });
  });
};

module.exports = mongodb.resource ('account', schema, 'gatekeeper_accounts');
