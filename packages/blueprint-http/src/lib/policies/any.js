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

const { some } = require ('lodash');
const Policy = require ('./policy');
const policyFactory = require ('./policy-factory');

/**
 * Aggregate of policies where one must pass for this policy to pass. If none
 * of the policies pass, then the aggregate policy fails.
 *
 * @param       definitions       Array of policy definitions
 * @param       code              Failure code
 * @param       message           Failure message
 */
function any (definitions, code, message) {
  return class AnyPolicy extends Policy {
    constructor () {
      super (code, message);
    }

    async configure (app) {
      this.policies = await Promise.all (definitions.map (policy => policyFactory (policy, app)));
    }

    async runCheck (req) {
      const results = await Promise.all (this.policies.map (policy => policy.runCheck (req)));
      return some (results, value => value === true);
    }
  }
}

module.exports = any;

/**
 * Similar to any(), but the definitions will be executed in order, not all
 * at once.
 *
 * @param definitions       The policy definitions
 * @param code              Failure code
 * @param message           Failure message
 */
any.ordered = function (definitions, code = 'policy_failed', message = 'The request did not satisfy any required policy.') {
  return class AnyOrderPolicy extends Policy {
    constructor () {
      super (code, message);
    }

    async configure (app) {
      this.policies = await Promise.all (definitions.map (policy => policyFactory (policy, app)));
    }

    async runCheck (req) {
      return this._runCheck (req, 0);
    }

    async _runCheck (req, i) {
      // We have reach the end of the policy list. This means that all policies
      // have failed and we mark the entire policy as failed.
      if (i >= this.policies.length)
        return false;

      // We need to resolve the next policy on our list. After the policy is resolved,
      // we continue to the next policy if the current policies fails. If the current
      // policy passes, then we can stop.

      const result = await this.policies[i].runCheck (req);
      return result || this._runCheck (req, i + 1);
    }
  }
};