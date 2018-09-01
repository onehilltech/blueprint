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

const { Policy } = require ('@onehilltech/blueprint');
const { get } = require ('lodash');

/**
 * @class CheckPasswordPolicy
 *
 * Base policy that provides common behavior for checking a password.
 */
module.exports = Policy.extend ({
  failureCode: 'invalid_password',

  failureMessage: 'The password is invalid.',

  location: null,

  setParameters (location) {
    this.location = location;
  },

  runCheck (req) {
    const password = get (req, this.location);
    return this.checkPassword (password);
  },

  checkPassword (/* password */) {
    return true;
  }
});