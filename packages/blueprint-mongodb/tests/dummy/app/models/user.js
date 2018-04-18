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

const mongodb = require ('../../../../lib/');
const Author  = require ('./author');

const bookstore = new mongodb.Schema ({
  name: {type: String},

  authors: [{type: mongodb.Schema.Types.ObjectId, ref: 'author'}]
});

const schema = new mongodb.Schema ({
  first_name: {type: String},

  last_name: {type: String},

  email: {type: String},

  // ObjectId that can be populated because there is a ref.
  favorite_author: {type: mongodb.Schema.Types.ObjectId, ref: Author.modelName},

  // ObjectId that cannot be populated because there is no ref.
  random_id: {type: mongodb.Schema.Types.ObjectId},

  // Array of ObjectIds that can be populated.
  blacklist: [{type: mongodb.Schema.Types.ObjectId, ref: Author.modelName}],

  bookstore: bookstore
});

module.exports = mongodb.resource ('user', schema, 'blueprint_users');
