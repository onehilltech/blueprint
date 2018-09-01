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
const { Schema } = mongodb;
const { Types: { ref, Mixed } } = Schema;

const Account = require ('./account');
const Client = require ('./client');

const options = require ('./-common-options') ({
  discriminatorKey: 'type',
  softDelete: true
});

const schema = new Schema ({
  /// The type of event.
  type: { type: String, required: true, index: true },

  /// The client making the request.
  client: ref (Client, { required: true, index: true }),

  /// The user making the request. This property will not be present if the
  /// request is from a client.
  user: ref (Account, { index: true}),

  /// Name of the action.
  action: { type: String, required: true, index: true },

  /// Additional information about the event.
  metadata: { type: Mixed },

  request: {
    /// Ip-address of the request.
    ip: { type: String, required: true, index: true},

    url: { type: String, required: true}
  }
}, options);

module.exports = mongodb.resource ('gatekeeper.event', schema, 'gatekeeper_events');
