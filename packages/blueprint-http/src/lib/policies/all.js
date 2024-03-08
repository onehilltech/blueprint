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

const Policy = require ('./policy');
const policyFactory = require ('./policy-factory');
const handlePolicyFailure = require ('./-handle-policy-failure')

/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * @param       definitions       Array of policy definitions
 * @param       code              Failure code
 * @param       message           Failure message
 */
function all (definitions, code, message) {
  return class AllPolicy extends Policy {
    constructor () {
      super (code, message);
    }

    async configure (app) {
      this.policies = await Promise.all (definitions.map (policy => policyFactory (policy, app)));
    }

    async runCheck (req) {
      // Run check on all the policies.
      const results = await Promise.all (this.policies.map (policy => policy.runCheck (req)));

      // Review the results. If we find one policy that failed (i.e., the value is not true)
      // then the all policy has failed.

      const index = results.findIndex (result => result !== true);

      if (index === -1)
        return true;

      const result = results[index];
      const policy = this.policies[index];

      return handlePolicyFailure (result, policy);
    }
  }
}

/**
 * Similar to all(), but the definitions will be executed in order, not all
 * at once.
 *
 * @param definitions       The policy definitions
 */
all.ordered = function (definitions) {
  return class AllOrderPolicy extends Policy {
    async configure (app) {
      this.policies = await Promise.all (definitions.map (policy => policyFactory (policy, app)));
    }

    async runCheck (req) {
      return this._runCheck (req, 0);
    }

    async _runCheck (req, i) {
      // We have reach the end of the policy list. This means that all policies
      // have passed and we mark the entire policy as passed.
      if (i >= this.policies.length)
        return true;

      // We need to resolve the next policy on our list. After the policy is resolved,
      // we continue to the next policy if the current policies passes.
      const policy = this.policies[i];
      const result = await policy.runCheck (req);

      if (result === true)
        return this._runCheck (req, i + 1);

      return handlePolicyFailure (result, policy);
    }
  }
};

module.exports = all;
