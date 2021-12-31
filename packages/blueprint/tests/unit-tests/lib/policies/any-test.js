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
const { Policy, policies: {any, check} } = blueprint;

describe.only ('lib | policies | any', function () {
  it ('should pass because all policies pass', async function () {
    const TestPolicy = any ([
      check ('identity', true),
      check ('identity', true)
    ]);

    const policy = new TestPolicy ();
    await policy.configure (blueprint.app);
    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  it ('should pass because at least one policy passes', async function () {
    const TestPolicy = any ([
      check ('identity', true),
      check ('identity', false)
    ]);

    const policy = new TestPolicy ();
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  it ('should fail since all policies fail', async function () {
    const TestPolicy = any ([
      check ('identity', false),
      check ('identity', false)
    ]);

    const policy = new TestPolicy ();
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();

    expect (result).to.be.false;
  });

  it ('should support nested policies', async function () {
    const TestPolicy = any ([
      check ('identity', false),
      check ('identity', false),

      any ([
        check ('identity', false),
        check ('identity', true),
      ])
    ]);

    const policy = new TestPolicy ();
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  context.only ('ordered', function () {
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

    it ('should evaluate the policies in order', async function () {
      let policies = [
        new SimplePolicy (1, false),
        new SimplePolicy (2, false),
        new SimplePolicy (3, true),
        new SimplePolicy (4, false),
      ];

      const Policy = any.ordered (policies);
      const policy = new Policy ();
      await policy.configure (blueprint.app);


      let req = {
        values: []
      };

      const result = await policy.runCheck (req);

      expect (result).to.be.true;
      expect (req.values).to.eql ([1, 2, 3]);
    });

    it ('should fail', async function () {
      let policies = [
        new SimplePolicy (1, false),
        new SimplePolicy (2, false),
        new SimplePolicy (3, false),
        new SimplePolicy (4, false),
      ];

      const Policy = any.ordered (policies);
      const policy = new Policy ();
      await policy.configure (blueprint.app);

      let req = {
        values: []
      };

      const result = await policy.runCheck (req);

      expect (result).to.be.false;
      expect (req.values).to.eql ([1, 2, 3, 4]);
    });
  });
});
