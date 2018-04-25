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

const {
  isString
} = require ('lodash');

const Policy = require ('../policy');
const check = require ('./check');
const Check = require ('./-check');

function policyMaker (policy, app) {
  if ((policy instanceof Policy))
    return policy;

  if ((policy instanceof Check))
    return policy.createPolicy (app);

  // In both cases, we recursively call ourselves just in case we need to
  // add logic around creating the policy middleware when using an instance
  // of the policy, which is expected.

  if (isString (policy))
    return policyMaker (check (policy), app);

  return new policy ({app});
}

module.exports = policyMaker;