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

const assert  = require ('assert');
const { BO }  = require ('base-object');
const { get } = require ('lodash');

const NegatePolicy = require ('./negate');

/**
 * @class Check
 *
 * Policy check that delay loads the policy.
 */
const Check = BO.extend ({
  policyName: null,

  params: null,

  optional: false,

  negate: false,

  createPolicy (app) {
    let Policy = get (app.resources.policies, this.policyName);

    if (!Policy) {
      if (this.optional)
        return null;

      assert (false, `We could not locate the policy ${this.policyName}.`);
    }

    let policy = (Policy instanceof Check) ? Policy.createPolicy (app) : new Policy ({app});

    if (this.params && this.params.length > 0)
      policy.setParameters (...this.params);

    if (this.negate)
      policy = new NegatePolicy ({policy});

    return policy;
  }
});

module.exports = Check;
