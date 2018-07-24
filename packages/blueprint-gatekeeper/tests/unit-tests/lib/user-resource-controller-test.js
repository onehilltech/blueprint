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

const { request } = require ('@onehilltech/blueprint-testing');
const { seed, lean, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');

describe ('lib | UserResourceController', function () {
  it ('should create resource with requester as owner', function () {
    const { accounts: [account] } = seed ();
    const _id = new ObjectId ().toString ();

    const book = { _id, title: 'Fences' };
    const expected = Object.assign ({}, book, {owner: account.id, __v: 0});

    return request ()
      .post ('/books')
      .withUserToken (0)
      .send ({ book })
      .expect (200, { book: expected });
  });
});
