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

const { get } = require ('lodash');
const Policy = require ('./policy');
const NegatePolicy = require ('./negate');
const IdentityPolicy = require ('./identity');

/**
 * @class Check
 *
 * Policy check that delay loads the policy.
 */
module.exports = class Check extends Policy {
  /**
   * Constructor
   *
   * @param name          Name of the policy
   * @param options       Check options
   */
  constructor (name, options = {}) {
    super ();

    this.name = name;
    this.params = options.params || [];
    this.optional = options.optional;
    this.negate = options.negate;
  }

  async configure (app) {
    return this._load (app).configure (app);
  }

  /**
   * @override
   */
  async runCheck (req) {
    return this.policy.runCheck (req);
  }

  /**
   * Load the policy into memory.
   */
  _load (app) {
    // The policy has never been loaded. Let's load the policy into memory. This
    // is a one-time cost the first time the policy is evaluated.

    const Policy = get (app.resources.policies, this.name);

    if (!Policy) {
      // The policy cannot be located. We are going to see if the policy is optional.
      // If the policy is optional, then we can return null. Otherwise, we need to
      // raise an exception to stop the process.

      if (!this.optional)
        throw new Error (`We could not locate policy ${this.name}.`);

      this.policy = new IdentityPolicy (true);
    }
    else {
      // Create the policy. Then, we are going to negate it, if applicable.
      // After we the valid policy instance, we are set the parameters and
      // the instruct it to configure itself.

      this.policy = new Policy ();

      if (this.negate)
        this.policy = new NegatePolicy (this.policy);

      if (this.params)
        this.policy.setParameters (...this.params);
    }

    return this.policy;
  }
}
