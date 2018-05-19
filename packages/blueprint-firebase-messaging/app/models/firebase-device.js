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

const {
  Schema: {
    Types: { ref }
  }
} = mongodb;

const options = {
  toJSON: {
    versionKey: false,
    depopulate: true
  },

  toObject: {
    versionKey: false,
    depopulate: true
  }
};

let schema = new mongodb.Schema({
  /// The device instance id.
  device: {type: String, required: true, unique: true, index: true, const: true},

  /// The client the device is associated with.
  client: ref ('client', {required: true, validation: {optional: true}}),

  /// Access token for the device. We use the device access token in our
  /// request we consider the device token from Firebase to be unsafe to
  /// authenticate our requests.
  token: {type: String},

  /// The user account associated with the account.
  user: ref ('account', {validation: {optional: true}})
}, options);

module.exports = mongodb.resource ('device', schema, 'firebase_devices');
