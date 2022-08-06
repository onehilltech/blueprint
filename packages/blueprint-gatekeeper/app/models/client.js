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

const discriminatorKey = 'type';
const options = require ('./-common-options') ({discriminatorKey});
const mongodb = require ('@onehilltech/blueprint-mongodb');
const moment = require ('moment');

const { isEmpty, findIndex } = require ('lodash');
const { isEmail } = require ('validator');

const {
  Schema: {
    Types: {ObjectId}
  }
} = mongodb;

options.softDelete = true;


let schema = new mongodb.Schema ({
  /// The type of client.
  type: {type: String, required: true},

  /// Name of the client.
  name: {type: String, required: true, trim: true},

  /// Contact email address for the client.
  email: {type: String, required: true, trim: true, lowercase: true, validate: [isEmail, 'Not a valid email address.']},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The default scope for the client. The scope is applied to the access
  /// token for the client.
  scope: {type: [String]},

  /// Accounts allowed to use the client. This list is used when the client
  /// is marked private.
  allow: {type: [ObjectId], ref: 'account'},

  /// Accounts not allowed to use the client. This list is always used.
  deny: {type: [ObjectId], ref: 'account'},

  /// The expiration time for token of this client.
  expiration: {type: String},

  /// The url for resetting the password. If this is not present, then the
  /// client does not support resetting a user's password.
  password_reset_url: { type: String },

  /// The base url to use for verifying an account. If the client does not provide
  /// this url, then the client is not able to verify accounts.
  verify_account_url: { type: String },

  /// The redirection url for account verification.
  verify_account_redirect_url: { type: String },

  /// The expiration time for activating an account via this client.
  verify_expires_in: { type : String, default: '7 days'}
}, options);


/**
 * Get the client id, which is an alias for _id.
 */
schema.virtual ('client_id').get (function () {
  return this._id;
});

/**
 * Test if the client is restricted. A restricted client is one that has an account
 * in either the allow or deny list.
 */
schema.virtual ('restricted').get (function () {
  return !isEmpty (this.allow) || !isEmpty (this.deny);
});

/**
 * Test if the account is verified.
 */
schema.virtual ('verified').get (function () {
  return true;
});


schema.methods.allowed = function (account) {
  return (isEmpty (this.allow) && isEmpty (this.deny)) ||
    (!isEmpty (this.deny) && -1 === findIndex (this.deny, id => account._id.equals (id))) ||
    (!isEmpty (this.allow) && -1 !== findIndex (this.allow, id => account._id.equals (id)));
};

schema.methods.computeExpiration = function (from = new Date ()) {
  if (!this.expiration)
    return;

  // Compute the expiration date for the access token. The expiration statement
  // in the client is a a relative time phrase (i.e., 1 day, 60 seconds, etc).
  let parts = this.expiration.split (' ');
  return moment (from).add (...parts).toDate ();
};

const MODEL_NAME = 'client';
const COLLECTION_NAME = 'gatekeeper_clients';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
