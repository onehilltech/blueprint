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

const mongodb  = require ('@onehilltech/blueprint-mongodb');
const Schema   = mongodb.Schema;
const ref = mongodb.Schema.Types.ref;

const Client   = require ('./client');
const options  = require ('./-common-options') ({discriminatorKey});

let schema = new Schema ({
  /// Client the token was created with.
  client: ref (Client, {required: true, index: true}),

  /// Enabled state for the token.
  enabled: {type: Boolean, required: true, default : true},

  /// The access scopes for the token.
  scope: {type: [String], default: []},

  /// Optional origin for binding the token to a host/origin. This is important
  /// with dealing with x-site scripting.
  origin: {type: String}
}, options);

const MODEL_NAME = 'access_token';
const COLLECTION_NAME = 'gatekeeper_access_tokens';

module.exports = mongodb.model (MODEL_NAME, schema, COLLECTION_NAME);
