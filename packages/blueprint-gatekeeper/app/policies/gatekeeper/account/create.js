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
  policies: { check, all }
} = require ('@onehilltech/blueprint');

module.exports = all ([
  check ('gatekeeper.scope', 'gatekeeper.account.create'),

  /*
   * Check the password policy. The password policy is optional. If an application
   * wants to enable password policies, then they just need to overload this policy
   * in their application.
   */
  check ('?gatekeeper.account.password.check', 'body.account.password')
]);


