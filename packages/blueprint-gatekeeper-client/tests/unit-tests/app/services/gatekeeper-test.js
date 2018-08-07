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
const { expect } = require ('chai');
const fs = require ('fs-extra');

describe.skip ('app | services | gatekeeper', function () {
  context ('without saved token', function () {
    it ('should configure the service without an access token', function () {
      const gatekeeper = blueprint.lookup ('service:gatekeeper');

      return fs.exists (gatekeeper._accessTokenFilename)
        .then (exists => exists ? fs.unlink (gatekeeper._accessTokenFilename) : null)
        .then (() => gatekeeper.configure ())
        .then (() => {
          expect (gatekeeper.accessToken).to.equal (null);
        });
    });
  });

  context ('with saved token', function () {
    beforeEach (function () {
      const gatekeeper = blueprint.lookup ('service:gatekeeper');

      return fs.writeJson (gatekeeper._accessTokenFilename, {
        access_token: 'access_token',
        refresh_token: 'refresh_token'
      });
    });

    afterEach (function () {
      const gatekeeper = blueprint.lookup ('service:gatekeeper');
      return fs.exists (gatekeeper._accessTokenFilename).then (exists => exists ? fs.unlink (gatekeeper._accessTokenFilename) : null);
    });

    it ('should initialize service with access token', function () {
      const gatekeeper = blueprint.lookup ('service:gatekeeper');

      expect (gatekeeper.accessToken).to.eql ({
        access_token: 'access_token',
        refresh_token: 'refresh_token'
      });
    });
  });
});
