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

const mm = require ('micromatch');
const mongodb  = require ('@onehilltech/blueprint-mongodb');

const Schema   = mongodb.Schema;
const ref = mongodb.Schema.Types.ref;

const Client   = require ('./client');
const options  = require ('./-common-options') ({discriminatorKey});
options.softDelete = true;

let schema = new Schema ({
  /// Client the token was created with.
  client: ref (Client, {required: true, index: true}),

  /// Enabled state for the token.
  enabled: {type: Boolean, required: true, default : true},

  /// The access scopes for the token.
  scope: {type: [String], default: []},

  /// Optional origin for binding the token to a host/origin. This is important
  /// with dealing with x-site scripting.
  origin: {type: String},

  /// The expiration time for the token. If there is no expiration, then the token
  /// is usable until it has been revoked.
  expiration: {type: Date},

  /// User-defined payload added to the access token.
  payload: { type: Schema.Types.Mixed },

  /// The issuer of the token.
  issuer: { type: String },

  /// The target audience for the access token.
  audience: { type: String },

  /// The subject of the access token.
  subject: { type: String},

  usage: {
    /// Current number of times the access token has been used.
    current: { type: Number, required: true, default: 0 },

    /// Maximum number of uses for the access token.
    max: { type: Number }
  }
}, options);

schema.methods.maxUsageLimit = function () {
  return !!this.usage.max && this.usage.current >= this.usage.max;
};

schema.methods.supports = function (list) {
  return mm.some (list, this.scope);
}

/**
 * Check the access token matches the required options.
 *
 * @param options         The options to check.
 */
schema.methods.check = function (options) {
  const audience = options.aud || options.audience;
  const subject = options.sub || options.subject;

  if (!!audience && !!this.audience && audience !== this.audience)
    return false;

  if (!!subject && !!this.subject && subject !== this.subject)
    return false;

  return true;
};

const MODEL_NAME = 'access_token';
const COLLECTION_NAME = 'gatekeeper_access_tokens';

module.exports = mongodb.model (MODEL_NAME, schema, COLLECTION_NAME);
