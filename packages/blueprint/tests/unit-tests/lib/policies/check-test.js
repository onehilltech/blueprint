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

const chai = require ('chai');
chai.use (require ('chai-as-promised'))
const { expect } = chai;

const blueprint = require ('../../../../lib');
const { Policy, policies: { check }} = blueprint;

describe.only ('lib | policies | check', function () {
  it ('should create a policy check', async function () {
    let policy = check ('identity', true);

    expect (policy).to.be.instanceOf (Policy)
    expect (policy).to.respondsTo ('runCheck');

    // Configure the policy for this application.
    policy.configure (blueprint.app);
    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });

  it ('should error because policy is not found', async function () {
    await expect (check ('does-not-exist', true).configure (blueprint.app)).to.be.rejectedWith (Error)
  });

  it ('should not error on optional policy not found', async function () {
    const policy = check ('?does-not-exist', true);
    await policy.configure (blueprint.app);

    await expect (policy).to.be.instanceOf (Policy);
    const result = await policy.runCheck ();

    expect (result).to.be.true;
  });
});
