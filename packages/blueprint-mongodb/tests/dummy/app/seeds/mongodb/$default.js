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

const { ref, id } = require ('@onehilltech/dab');
const { Seed } = require ('../../../../../lib');

module.exports = Seed.extend ({
  model () {
    return {
      __mongodb: [
        { _id: id ('619b0a46c8d6ae7eefd9665e'), version: 1}
      ],

      authors: [
        {name: 'Jack Black'},
        {name: 'John Doe'},
        {name: 'Lisa Wilson'},
        {name: 'Robert Young'},
        {name: 'Todd Hill'},
        {name: 'Tom Sawyer'},
        {name: 'Tom Smith'},
      ],

      users: [
        {
          first_name: 'Paul',
          last_name: 'Black',
          favorite_author: ref ('authors[0]'),
          blacklist: [ref ('authors[0]'), ref ('authors[1]')]
        },
        {
          first_name: 'John',
          last_name: 'Smith',
          favorite_author: ref ('authors[0]'),
          bookstore: {name: 'Borders', authors: [ref ('authors[3]')]},
          bookstores: [{name: 'Books-a-Million', authors: [ref ('authors[6]')]}]
        }
      ],

      books: [
        { name: 'To Kill A Mockingbird' },
        { name: 'The Great Gatsby' },
        { name: 'Their Eyes Were Watching God' },
        { name: 'Fences'}
      ]
    }
  }
});
