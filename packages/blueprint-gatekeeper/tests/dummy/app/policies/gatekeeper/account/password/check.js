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

const CheckPasswordPolicy = require ('../../../../../../../lib/check-password-policy');

/**
 * Example password check policy. The password must contain the following:
 *
 *  * 1 number
 *  * 1 lowercase letter
 *  * 1 uppercase letter
 *  * min length of 8
 */
module.exports = CheckPasswordPolicy.extend ({
  rules: /^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*)$/,

  checkPassword (password) {
    return password.match (this.rules) === null;
  }
});