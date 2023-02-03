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
  ForbiddenError,
  BadRequestError,
  service,
  model,
} = require ('@onehilltech/blueprint');

const basic = require ('basic-auth');

/**
 * @class BearerPolicy
 *
 * The policy for evaluating the OAuth 2.0 bearer strategy.
 */
module.exports = Policy.extend ({
  Account: model ('account'),

  /**
   * Set the parameters of the policy.
   */
  setParameters (options = {}) {
    this.realm = options.realm;
  },

  async runCheck (req, res) {
    const credentials = basic (req);
    const account = await this._checkCredentials (credentials);

    if (!!account) {
      req.user = account;
      return true;
    }
    else {
      res.setHeader ('WWW-Authenticate', `Basic realm="${this.realm}"`);
      return false;
    }
  },

  async _checkCredentials (credentials = {}) {
    const { name, pass } = credentials;

    if (!name || !pass)
      return false;

    await this.Account.authenticate (name, pass);
  }
});
