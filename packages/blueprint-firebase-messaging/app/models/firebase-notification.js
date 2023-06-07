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

/**
 * This schema holds the various notifications sent via the framework.
 */
let schema = new mongodb.Schema ({
  /// The user account associated with the account.
  account: refersTo ('account', { required: true }),

  /// The timestamp of the notification.
  date: { type: Date, required: true, default: Date.now },

  /// The message sent in the notification.
  title: { type: String },

  /// The body of the notification.
  body: { type: String, required: true },

  /// The data associated with the notification.
  data: {},
}, options);

module.exports = mongodb.resource ('firebase-notification', schema, 'firebase_notifications');
