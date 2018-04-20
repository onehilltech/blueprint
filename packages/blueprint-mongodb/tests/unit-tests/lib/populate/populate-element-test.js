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

const blueprint = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const PopulateElement = require ('../../../../lib/populate/populate-element');
const seed = require ('../../../../lib/seed');

describe ('lib | populate | PopulateElement', function () {
  describe ('populate', function () {
    it ('should populate an element', function () {
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: User});
      const {users} = seed ('$default');

      let user = users[0];

      return populate.populate (user._id).then (u => {
        expect (u.lean ()).to.eql (user.lean ());
      });
    });
  });
});