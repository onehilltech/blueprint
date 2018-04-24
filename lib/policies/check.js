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

const NegatePolicy = require ('./negate');
const framework = require ('../-framework');

const {
  get
} = require ('lodash');

/**
 * The check policy builder will lookup an existing policy by name. The first
 * parameter to the check() method is the name of the policy. All remaining parameters
 * are passed to the policy factory method. If the policy is not found, then an
 * exception is thrown.
 *
 * If the name of the policy starts with a question mark (?), then the policy
 * is considered optional.
 *
 * @returns {*}
 */
module.exports = function () {
  const [name, ...params] = arguments;
  const optional = name[0] === '?';
  const not = name[0] === '!';
  const policyName = (optional || not) ? name.slice (1) : name;

  try {
    const Policy = require ('../-framework').lookup (`policy:${policyName}`);

    let policy = new Policy ();
    policy.setParameters (...params);

    if (not)
      policy = new NegatePolicy ({policy});

    return policy;
  }
  catch (err) {
    if (optional)
      return null;

    assert (false, `We cannot locate policy ${policyName}.`);
  }
};