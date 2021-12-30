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
const blueprint = require ('../../../../lib');

describe ('lib | policies | negate', function () {
  it ('should negate a true to false', function (done) {
    let policy = check ('!identity', true).createPolicy (blueprint.app);

    policy.runCheck ().then (result => {
      expect (result).to.be.false;
      return done (null);
    }).catch (done);
  });

  it ('should negate a false to true', function (done) {
    let policy = check ('!identity', false).createPolicy (blueprint.app);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });

  it ('should negate a failure object to true', function (done) {
    let ck = check ('!identity', {failureCode: 'failed', failureMessage: 'The message'});
    let policy = ck.createPolicy (blueprint.app);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });
});
