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

const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema: { Types: { refersTo } } } = mongodb;

const options = {

};

let schema = new mongodb.Schema ({
  /// The client the device is associated with.
  client: refersTo ('client', { required: true, const: true, validation: { optional: true }}),

  /// The user account associated with the account.
  account: refersTo ('account', { required: true, const: true, validation: { optional: true }}),

  /// The authentication session for the device token. This field is never serialized
  /// to the client.
  session: refersTo ('user-token', { required: true, hidden: true, validation: { optional: true } }),

  /// The Firebase registration token for the instance. This token must always be unique or
  /// it will result in user receiving a notification multiple times.
  token: { type: String, required: true, unique: true },
}, options);

module.exports = mongodb.resource ('firebase-device', schema, 'firebase_devices');
