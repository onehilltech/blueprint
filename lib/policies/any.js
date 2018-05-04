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
  some,
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
function any (definitions, failureCode = 'policy_failed', failureMessage = 'The request did not satisfy any required policy.') {
  function isTrue (value) {
    return value === true;
  }

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
        .then (results => some (results, isTrue));
    }
  });
};

module.exports = any;

/**
 * Similar to all(), but the definitions will be executed in order, not all
 * at once.
 *
 * @param definitions
 * @param failureCode
 * @param failureMessage
 * @return {*}
 */
any.ordered = function (definitions, failureCode = 'policy_failed', failureMessage = 'The request did not satisfy any required policy.') {
  return Policy.extend ({
    /// The failure code.
    failureCode,

    /// The failure message.
    failureMessage,

    /// List of policies to evaluate.
    policies: null,

    init () {
      this._super.call (this, ...arguments);

      this.policies = compact (definitions.map (policy => policyMaker (policy, this.app)));
    },

    runCheck (req) {
      return new Promise ((resolve, reject) => this._runCheck (req, 0).then (resolve).catch (reject));
    },

    _runCheck (req, i) {
      // We have reach the end of the policy list. This means that all policies
      // have failed and we mark the entire policy as failed.
      if (i >= this.policies.length)
        return Promise.resolve (false);

      // We need to resolve the next policy on our list. After the policy is resolved,
      // we continue to the next policy if the current policies fails. If the current
      // policy passes, then we can stop.
      let result = this.policies[i].runCheck (req);
      return Promise.resolve (result).then (result => result === true ? Promise.resolve (true) : this._runCheck (req, i + 1));
    }
  });
};