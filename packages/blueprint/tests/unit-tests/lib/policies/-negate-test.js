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
const Policy = require ('../../../../lib/policy');

describe ('lib | policies | -negate', function () {
  let policies = {
    identity : Policy.extend ({
      setParameters (value) {
        this.value = value;
      },

      runCheck () { return this.value; }
    })
  };

  it ('should negate a true to false', function (done) {
    let policy = check ('!identity', true).createPolicy (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.false;
      return done (null);
    }).catch (done);
  });

  it ('should negate a false to true', function (done) {
    let policy = check ('!identity', false).createPolicy (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });

  it ('should negate a failure object to true', function (done) {
    let policy = check ('!identity', {failureCode: 'failed', failureMessage: 'The message'}).createPolicy (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });
});
