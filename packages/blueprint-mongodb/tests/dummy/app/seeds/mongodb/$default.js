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

const {
  ref
} = require ('@onehilltech/dab');

module.exports = {
  authors: [
    {name: 'John Doe'}, //
    {name: 'Robert Young'}, //
    {name: 'Tom Smith'},
    {name: 'Tom Sawyer'}, //
    {name: 'Jack Black'},
    {name: 'Lisa Wilson'},
    {name: 'Todd Hill'} //
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
  ]
};
