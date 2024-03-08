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

const {
  expect
} = require ('chai');

const check = require ('../../../../lib/policies/check');
const blueprint = require ('@onehilltech/blueprint');

describe ('lib | policies | negate', function () {
  it ('should negate a true to false', async function () {
    const policy = check ('!identity', true);
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();
    expect (result).to.be.false;
  });

  it ('should negate a false to true', async function () {
    const policy = check ('!identity', false);
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();
    expect (result).to.be.true;
  });

  it ('should negate a failure object to true', async function () {
    const policy = check ('!identity', { code: 'failed', message: 'The message'});
    await policy.configure (blueprint.app);

    const result = await policy.runCheck ();
    expect (result).to.be.true;
  });
});
