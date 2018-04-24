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

const Policy = require ('../../../../lib/policy');
const check = require ('../../../../lib/policies/check');

describe ('lib | policies | check', function () {
  let policies = {
    identity : Policy.extend ({
      setParameters (value) {
        this.value = value;
      },

      runCheck () { return this.value; }
    })
  };

  it ('should create a policy check', function () {
    let policy = check ('identity', true).createPolicy (policies);

    expect (policy).to.be.instanceof (Policy);
    expect (policy.runCheck ()).to.be.true;
  });

  it ('should error because policy is not found', function () {
    expect (() => { check ('does-not-exist', true).createPolicy (policies); }).to.throw (Error);
  });

  it ('should not error on optional policy not found', function () {
    expect (check ('?does-not-exist', true).createPolicy (policies)).to.be.null;
  });
});
