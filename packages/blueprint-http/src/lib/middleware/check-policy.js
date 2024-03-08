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

const InternalServerError = require ('../internal-server-error');
const ForbiddenError = require ('../forbidden-error');
const { isObjectLike } = require ('lodash');

/**
 * Factory method for creating a policy middleware for a request.
 *
 * @param policy          A Policy object
 * @returns {Function}
 */
module.exports = function (policy) {
  return async function __blueprint_check_policy (req, res, next) {
    try {
      const result = await policy.runCheck (req);

      if (result === true)
        return next ();

      if (result === false) {
        // The policy result was a boolean value. This means that we are to use
        // the default failure code and message as the policy error.
        const { code, message } = policy;
        return next (new ForbiddenError (code, message));
      }
      else if (isObjectLike (result)) {
        // The result is an object. This means we are to use the result
        // as-is for the policy error.
        const {code = policy.code, message = policy.message} = result;

        return next (new ForbiddenError (code, message));
      }
      else {
        return next (new InternalServerError ('policy_error', 'Unexpected error occurred while running policy check.'));
      }
    }
    catch (err) {
      return next (err);
    }
  };
};
