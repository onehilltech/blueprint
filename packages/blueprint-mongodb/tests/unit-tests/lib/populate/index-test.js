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

const blueprint  = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

const lean = require ('../../../../lib/lean');
const seed = require ('../../../../lib/seed');

const {
  populateModel,
  populateModels
} = require ('../../../../lib/populate');

describe ('lib | populate', function () {
  describe ('populateModel', function () {
    it ('should populate a model', function () {
      let {users,authors} = seed ('$default');

      return populateModel (users[0]).then (models => {
        expect (models).to.have.keys (['authors','users']);

        expect (lean (models.authors)).to.have.deep.members (lean ([authors[0], authors[1]]));
        expect (lean (models.users)).to.have.deep.members ([users[0].lean ()]);
      });
    });
  });

  describe ('populateModels', function () {
    it ('should populate a group models', function () {
      let {users,authors} = seed ('$default');

      return populateModels (users).then (models => {
        expect (models).to.have.keys (['authors','users']);

        expect (lean (models.users)).to.have.deep.members (lean ([users[0], users[1]]));
        expect (lean (models.authors)).to.have.deep.members (lean ([authors[0], authors[1], authors[3], authors[6]]));
      });
    });
  });
});
