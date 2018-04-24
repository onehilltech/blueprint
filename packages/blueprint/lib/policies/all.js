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

const Policy = require ('../policy');
const policyMaker = require ('./policy-maker');

const {
  every
} = require ('lodash');

/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * @param       definitions       Array of policy definitions
 * @param       failureCode       Failure code
 * @param       failureMessage    Failure message
 */
module.exports = function (definitions, failureCode = 'policy_failed', failureMessage = 'The request did not satisfy a required policy.') {
  let policies = definitions.map (policy => policyMaker (policy));

  function isTrue (value) {
    return value === true;
  }

  return Policy.extend ({
    failureCode,

    failureMessage,

    runCheck (req) {
      return Promise.all (policies.map (policy => policy.runCheck (req)))
        .then (results => every (results, isTrue))
        .then (result => result ? result : {failureCode: this.failureCode, failureMessage: this.failureMessage});
    }
  });
};
