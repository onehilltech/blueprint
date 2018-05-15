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

const {
  expect
} = require ('chai');

describe ('app | policies | gatekeeper | scope', function () {
  function makePolicy (parameters) {
    let Policy = blueprint.lookup ('policy:gatekeeper.scope');
    let policy = new Policy ();
    policy.setParameters (parameters);

    return policy;
  }

  context ('no pattern', function () {
    it ('the policy should pass', function () {
      let policy = makePolicy ('a.b');
      let req = { scope: ['a.b'] };

      expect (policy.runCheck (req)).to.be.true;
    });

    it ('the policy should fail', function () {
      let policy = makePolicy ('a.b');
      let req = { scope: ['a.c'] };

      expect (policy.runCheck (req)).to.be.false;
    });
  });

  context ('glob pattern', function () {
    it ('the policy should pass', function () {
      let policy = makePolicy ('a.b.c');
      let req = { scope: ['a.b.*'] };

      expect (policy.runCheck (req)).to.be.true;
    });

    it ('the policy should fail', function () {
      let policy = makePolicy ('a.c.d');
      let req = { scope: ['a.b.*'] };

      expect (policy.runCheck (req)).to.be.false;
    });
  });
});