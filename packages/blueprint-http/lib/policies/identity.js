/*
 * Copyright (c) 2021 One Hill Technologies, LLC
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

const Policy = require ('./policy');

/**
 * @class NegatePolicy
 *
 * A proxy policy that negates any policy.
 */
module.exports = class IdentityPolicy extends Policy {
  /**
   * Constructor
   *
   * @param result        Target policy to negate
   * @param code          Failure code
   * @param message       Failure message
   */
  constructor (result, code, message) {
    super (code, message);

    this.result = result;
  }

  /**
   * @override
   */
  setParameters (result) {
    if (result !== undefined)
      this.result = result;
  }

  /**
   * @override
   */
  async runCheck (req) {
    return this.result;
  }
}
