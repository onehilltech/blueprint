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
  findIndex,
  compact
} = require ('lodash');

/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * @param       definitions       Array of policy definitions
 * @param       failureCode       Failure code
 * @param       failureMessage    Failure message
 * @param       resources
 */
module.exports = function (definitions, failureCode, failureMessage) {
  return Policy.extend ({
    failureCode,

    failureMessage,

    /// Collection of policies to check.
    policies: null,

    init () {
      this._super.call (this, ...arguments);

      this.policies = compact (definitions.map (policy => policyMaker (policy, this.app)));
    },

    runCheck (req) {
      return Promise.all (this.policies.map (policy => policy.runCheck (req)))
        .then (results => {
          // Locate the first policy that failed. If we cannot find a failed policy, then
          // all policies passed.

          let index = findIndex (results, result => result !== true);

          if (index === -1)
            return true;

          const {failureCode, failureMessage} = this.policies[index];

          return {failureCode, failureMessage};
        });
    }
  });
};
