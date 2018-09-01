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
const { Types: { ObjectId }} = Schema;

const Event = require ('./event');

const {
  schema: {
    options: {
      discriminatorKey
    }
  }
} = Event;

const options = require ('./-common-options') ({
  discriminatorKey,
  softDelete: true
});

const schema = new Schema ({
  resource: {
    /// Id of the resource.
    id: [{ type: ObjectId, required: true, index: true }],

    /// Name of the resource.
    name: { type: String, required: true, index: true }
  }
}, options);


module.exports = Event.discriminator ('resource_event', schema);
