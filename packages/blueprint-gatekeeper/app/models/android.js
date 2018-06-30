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
const Client  = require ('./client');
const options = require ('./-common-options') ();

options.discriminatorKey = Client.schema.options.discriminatorKey;
options.softDelete = true;

let schema = new mongodb.Schema ({
  /// The client secret, which can be auto-generated.
  client_secret: {type: String, required: true, validation: {optional: true}},

  /// Android package.
  package: {type: String, required: true}
}, options);

schema.methods.accept = function (v) {
  v.visitAndroidClient (this);
};

module.exports = Client.discriminator ('android', schema);
