/*
 * Copyright (c) 2019 One Hill Technologies, LLC
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

const { Service, model, service, BadRequestError } = require ('@onehilltech/blueprint');
const { get } = require ('lodash');

/**
 * @class GatekeeperService
 *
 * The service allows clients to perform system-level operations related to
 * authentication and authorization.
 */
module.exports = Service.extend ({
  /// Reference to the issuer service.
  issuer: service ('issuer'),

  /// Reference the account model.
  Account: model ('account'),

  /// Reference to the client model.
  Client: model ('client'),

  /**
   * Find the account by its username.
   *
   * @param username
   */
  findAccountByUsername (username) {
    return this.Account.findOne ({username});
  },

  /**
   * Find the account by its email.
   *
   * @param email
   */
  findAccountByEmail (email) {
    return this.Account.findOne ({email});
  },

  /**
   * Issue a token for the account on the specified client.
   *
   * @param clientId        Hosting client
   * @param account         The account model
   * @param payload
   * @param opts            Additional options
   */
  issueToken (clientId, account, payload, opts) {
    // If the client has an black and white list, then we need to make sure the
    // account is not in the black list and is in the white list.

    return this._findClient (clientId)
      .then (client => {
        if (!client)
          return Promise.reject (new BadRequestError ('invalid_client', 'The client does not exist.'));

        return this.issuer.issueUserToken (account, client, payload, opts);
    });
  },

  /**
   * Verify an issued token.
   *
   * @param token
   * @param opts
   * @returns {*|A}
   */
  verifyToken (token, opts) {
    return this.issuer.verifyToken (token, opts);
  },

  _findClient (client) {
    // We need to locate the account for the username, and check that the
    // provided password is correct. We also need to make sure the account
    // has not been disabled before we create the token.

    const collectionName = get (client, 'collection.name');

    if (collectionName === 'gatekeeper_clients')
      return Promise.resolve (client);

    return this.Client.findById (client).then (client => {
      if (!client)
        return Promise.reject (new BadRequestError ('invalid_client', 'The client does not exist.'));

      if (client.enabled !== true)
        return Promise.reject (new BadRequestError ('client_disabled', 'The client is disabled.'));

      return client;
    });
  },
});
