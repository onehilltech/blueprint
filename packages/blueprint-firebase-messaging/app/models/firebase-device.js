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

const { env } = require ('@onehilltech/blueprint');
const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema: { Types: { refersTo } } } = mongodb;

const options = {
  versionKey: env !== 'test',
};

let schema = new mongodb.Schema ({
  /// The client the device is associated with.
  client: refersTo ('client', {required: true, validation: { optional: true }}),

  /// The user account associated with the account.
  account: refersTo ('account', { required: true, validation: { optional: true }}),

  /// The Firebase registration token for the instance.
  token: { type: String, required: true },
}, options);

module.exports = mongodb.resource ('device', schema, 'firebase_devices');
