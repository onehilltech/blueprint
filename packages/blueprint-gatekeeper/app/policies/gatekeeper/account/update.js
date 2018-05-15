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
  Policy,
  policies: { check, any, all }
} = require ('@onehilltech/blueprint');

const {
  has
} = require ('lodash');

/**
 * Policy that prevents the user from updating or deleting the password.
 */
const NoUpdatePassword = Policy.extend ({
  failureCode: 'forbidden',
  failureMessage: 'You cannot update or delete the password.',

  runCheck (req) {
    return !has (req.body, 'account.password');
  }
});

/**
 * Policy that limits ability to update scope property on account to tokens
 * that have the scope update ability.
 */
const ScopeUpdatePolicy = Policy.extend ({
  failureCode: 'invalid_scope',
  failureMessage: 'You are not allowed to update the account scope.',

  scopePolicy: null,

  init () {
    this._super.call (this, ...arguments);

    const Policy = this.app.lookup ('policy:gatekeeper.scope');
    this.scopePolicy = new Policy ({app: this.app});
    this.scopePolicy.setParameters ('gatekeeper.account.update.scope');
  },

  runCheck (req) {
    return has (req.body, 'account.scope') ? this.scopePolicy.runCheck (req) : true;
  }
});

module.exports = all ([
  any ([
    check ('gatekeeper.account.me'),
    check ('gatekeeper.scope', 'gatekeeper.account.update'),
  ]),

  NoUpdatePassword,

  ScopeUpdatePolicy
]);

