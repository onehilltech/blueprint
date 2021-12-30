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
const Check = require ('./-check');

/**
 * Create a policy for the target application.
 *
 * @param policy
 * @param app
 */
module.exports = async function policyFactory (policy, app) {
  if (isString (policy))
    return check (policy);

  if ((policy instanceof Policy))
    return policy;

  // In both cases, we recursively call ourselves just in case we need to
  // add logic around creating the policy middleware when using an instance
  // of the policy, which is expected.

  const policyObj = new Policy ();
  await policyObj.configure (app);

  return policyObj;
}
