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

const { isString } = require ('lodash');
const Policy = require ('./policy');
const check = require ('./check');

/**
 * Create a policy for the target application.
 *
 * @param policy
 * @param app
 */
module.exports = async function policyFactory (policy, app) {
  if ((policy instanceof Policy)) {
    // Configure the policy instance for the target application.
    if (policy.app !== app)
      await policy.configure (app);

    return policy;
  }

  // Create a new policy instance, and configure it.
  const obj = isString (policy) ? check (policy) : new policy ();
  await obj.configure (app);

  return obj;
}
