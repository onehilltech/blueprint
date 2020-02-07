/*
 * Copyright (c) 2019 One Hill Technologies, LLC
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

const { expect } = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const { seed } = require ('@onehilltech/blueprint-mongodb');


describe ('app | services | session', function () {
  describe ('issueToken', function () {
    it ('should issue an user token', function () {
      const {
        accounts: [account],
        native: [client]
      } = seed ();

      const payload = { admin: true};

      let session = blueprint.lookup ('service:session');

      return session.issueToken (client.id, account, { payload }).then (result => {
        expect (result).to.have.keys (['access_token', 'refresh_token']);

        const { access_token, refresh_token } = result;

        expect (access_token.split ('.').length).to.equal (3);
        expect (refresh_token).to.be.undefined;
      });
    });
  });
});
