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

const { expect } = require ('chai');
const blueprint = require ('../../../../lib');

const {
  Policy,
  policies: {all, check}
} = blueprint;

describe ('lib | policies | all', function () {
  it ('should pass all policies', function () {
    const Policy = all ([
      check ('identity', true),
      check ('identity', true)
    ]);

    const policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  it ('should fail since one policy fails', function () {
    let Policy = all ([
      check ('identity', true),
      check ('identity', false)
    ], 'second_failed', 'The second policy failed.');

    let policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.eql ({
        failureCode: 'policy_failed',
        failureMessage: 'The request did not satisfy a required policy.'
      })
    });
  });

  it ('should support nested policies', function () {
    let Policy = all ([
      check ('identity', true),
      check ('identity', true),

      all ([
        check ('identity', true),
        check ('identity', true),
      ])
    ]);

    let policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  context ('ordered', function () {
    const SimplePolicy = Policy.extend ({
      value: null,

      result: true,

      runCheck (req) {
        req.values.push (this.value);
        return this.result;
      }
    });

    it ('should execute the policies in order', function () {
      let policies = [
        new SimplePolicy ({value: 1}),
        new SimplePolicy ({value: 2}),
        new SimplePolicy ({value: 3}),
        new SimplePolicy ({value: 4})
      ];

      const Policy = all.ordered (policies);
      const policy = new Policy ();

      let req = {
        values: []
      };

      return policy.runCheck (req).then (result => {
        expect (result).to.be.true;
        expect (req.values).to.eql ([1, 2, 3, 4]);
      })
    });

    it ('should fail', function () {
      let policies = [
        new SimplePolicy ({value: 1}),
        new SimplePolicy ({value: 2}),
        new SimplePolicy ({value: 3, result: false}),
        new SimplePolicy ({value: 4})
      ];

      const Policy = all.ordered (policies);
      const policy = new Policy ();

      let req = {
        values: []
      };

      return policy.runCheck (req).then (result => {
        expect (result).to.eql ({
          failureCode: 'policy_failed',
          failureMessage: 'The request did not satisfy a required policy.'
        });

        expect (req.values).to.eql ([1, 2, 3]);
      })
    });
  });
});
