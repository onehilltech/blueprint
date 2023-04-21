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
const {seed} = require ('@onehilltech/blueprint-mongodb');
const {expect} = require ('chai');

describe ('app | models | access-token', function () {
  describe ('create', function () {
    it ('should create an access token', function () {
      const { native } = seed ('$default');
      const AccessToken = blueprint.lookup ('model:access-token');

      let accessToken = new AccessToken ({
        client: native[0]._id
      });

      return accessToken.save ().then (model => {
        expect (model.lean ()).to.eql ({
          _id: accessToken.id,
          client: native[0].id,
          enabled: true,
          scope: [],
          usage: {
            current: 0
          }
        })
      });
    });
  });
});