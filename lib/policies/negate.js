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

const {
  isBoolean
} = require ('lodash');

/**
 * @class NegatePolicy
 *
 * A proxy policy that negates any policy.
 */
const NegatePolicy = Policy.extend ({
  policy: null,

  /**
   * Run the check.
   *
   * If the value is boolean, then we just negate the value. Otherwise, we
   * assume it is an failure object. This means the policy actually passes.
   *
   * If the check errors, then we just bubble the error.
   *
   * @param req
   * @returns {Promise<any>}
   */
  runCheck (req) {
    let result = this.policy.runCheck (req);

    return Promise.resolve (result).then (result => {
      return isBoolean (result) ? !result : true;
    });
  }
});

module.exports = NegatePolicy;
