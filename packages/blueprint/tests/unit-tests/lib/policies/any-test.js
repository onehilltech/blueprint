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

const any = require ('../../../../lib/policies/any');
const check = require ('../../../../lib/policies/check');

describe ('lib | policies | any', function () {
  it ('should pass any policies', function () {
    let Policy = any ([
      check ('identity', true),
      check ('identity', true)
    ]);

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  it ('should fail since one policy fails', function () {
    let Policy = any ([
      check ('identity', true),
      check ('identity', false)
    ]);

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  it ('should fail since all policies fail', function () {
    let Policy = any ([
      check ('identity', false),
      check ('identity', false)
    ]);

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.false;
    });
  });

  it ('should support nested policies', function () {
    let Policy = any ([
      check ('identity', false),
      check ('identity', false),

      any ([
        check ('identity', false),
        check ('identity', true),
      ])
    ]);

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });
});
