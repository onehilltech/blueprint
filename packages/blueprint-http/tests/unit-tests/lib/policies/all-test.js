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
const blueprint = require ('@onehilltech/blueprint');
const { Policy, policies: { all, check } } = require ('../../../../lib');

describe ('lib | policies | all', function () {
  it ('should pass all policies', async function () {
    const TestPolicy = all ([
      check ('identity', true),
      check ('identity', true)
    ]);

    const policy = new TestPolicy ();
    await policy.configure (blueprint.app);
    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  it ('should fail since one policy fails', async function () {
    let TestPolicy = all ([
      check ('identity', true),
      check ('identity', false)
    ]);

    let policy = new TestPolicy ();
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();

    expect (result).to.be.false;
  });

  it ('should support nested policies', async function () {
    let TestPolicy = all ([
      check ('identity', true),
      check ('identity', true),

      all ([
        check ('identity', true),
        check ('identity', true),
      ])
    ]);

    let policy = new TestPolicy ();
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  context ('ordered', function () {
    class SimplePolicy extends Policy {
      constructor (value, result) {
        super ();

        this.value = value;
        this.result = result;
      }

      runCheck (req) {
        req.values.push (this.value);
        return this.result;
      }
    }

    it ('should execute the policies in order', async function () {
      const TestPolicy = all.ordered ([
        new SimplePolicy (1, true),
        new SimplePolicy (2, true),
        new SimplePolicy (3, true),
        new SimplePolicy (4, true)
      ]);

      const policy = new TestPolicy ();
      await policy.configure (blueprint.app);

      let req = {
        values: []
      };

      const result = await policy.runCheck (req);

      expect (result).to.be.true;
      expect (req.values).to.eql ([1, 2, 3, 4]);
    });

    it ('should fail', async function () {
      const TestPolicy = all.ordered ([
        new SimplePolicy (1, true),
        new SimplePolicy (2, true),
        new SimplePolicy (3, false),
        new SimplePolicy (4, true)
      ]);

      const policy = new TestPolicy ();
      await policy.configure (blueprint.app);

      let req = {
        values: []
      };

      const result = await policy.runCheck (req);

      expect (result).to.be.false;
      expect (req.values).to.eql ([1, 2, 3]);
    });
  });
});
