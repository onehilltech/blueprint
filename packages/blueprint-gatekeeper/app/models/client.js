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
const { isEmpty, findIndex } = require ('lodash');

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
  email: {type: String, required: true, trim: true},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The default scope for the client. The scope is applied to the access
  /// token for the client.
  scope: {type: [String], default: []},

  /// The client is private. A private client can only be accessed by the user
  /// associated with the email for this client, and those that appear in the
  /// whitelist.
  private: {type: Boolean, default: false},

  /// Accounts allowed to use the client. This list is used when the client
  /// is marked private.
  allow: {type: [ObjectId], ref: 'account'},

  /// Accounts not allowed to use the client. This list is always used.
  deny: {type: [ObjectId], ref: 'account'}
}, options);


/**
 * Get the client id, which is an alias for _id.
 */
schema.virtual ('client_id').get (function () {
  return this._id;
});

schema.methods.allowed = function (account) {
  return (isEmpty (this.allow) && isEmpty (this.deny)) ||
    (!isEmpty (this.deny) && -1 === findIndex (this.deny, id => account._id.equals (id))) ||
    (!isEmpty (this.allow) && -1 !== findIndex (this.allow, id => account._id.equals (id)));
};

const MODEL_NAME = 'client';
const COLLECTION_NAME = 'gatekeeper_clients';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
