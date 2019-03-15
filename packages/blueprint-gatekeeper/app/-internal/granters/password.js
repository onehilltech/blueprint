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

const { model, BadRequestError, ForbiddenError } = require ('@onehilltech/blueprint');
const { union } = require ('lodash');
const moment = require ('moment');

const {
  Types: { ObjectId }
} = require ('@onehilltech/blueprint-mongodb');

const Granter = require ('../granter');

/**
 * @class Password
 *
 * Granter for the password strategy.
 */
module.exports = Granter.extend ({
  /// Name of the granter.
  name: 'password',

  /// The client model definition.
  Client: model ('client'),

  /// The account model definition.
  Account: model ('account'),

  /// The user token definition.
  UserToken: model ('user-token'),

  init () {
    this._super.call (this, ...arguments);
  },

  prepareForCreateToken (req) {
    // Let the users know we are creating a token. This means that we are
    // adding a new user session to the service. The listeners have the
    // option of preventing the login from occurring just by failing.

    return this.findAccount (req).then (account => this.app.emit ('gatekeeper.user_token.create', req, account));
  },

  /**
   * Create the UserToken for the request.
   *
   * @param req
   * @returns {doc}
   */
  onCreateToken (req) {
    // We need to locate the account for the username, and check that the
    // provided password is correct. We also need to make sure the account
    // has not been disabled before we create the token.

    let promises = [
      this.findClient (req),
      this.findAccount (req)
    ];

    const opts = { refreshable, scope } = req.body;
    opts.origin = req.get ('origin');

    return Promise.all (promises).then (([client, account]) => this._issueToken (client, account, opts));
  },

  onTokenCreated (req, token) {
    // Send a notification to all listeners that we have created a new
    // user token. This means the user is logged into the service.

    return this.app.emit ('gatekeeper.user_token.created', req, token);
  },

  findClient (req) {
    if (req.gatekeeperClient)
      return Promise.resolve (req.gatekeeperClient);

    const { client_id } = req.body;

    // We need to locate the account for the username, and check that the
    // provided password is correct. We also need to make sure the account
    // has not been disabled before we create the token.

    return this.Client.findById (client_id).then (client => {
      if (!client)
        return Promise.reject (new BadRequestError ('invalid_client', 'The client does not exist.'));

      if (client.enabled !== true)
        return Promise.reject (new BadRequestError ('client_disabled', 'The client is disabled.'));

      return client;
    });
  },

  findAccount (req) {
    if (req.account)
      return Promise.resolve (req.account);

    const {username, password} = req.body;

    // We need to locate the account for the username, and check that the
    // provided password is correct. We also need to make sure the account
    // has not been disabled before we create the token.

    return this.Account.findOne ({username}).then (account => {
      if (!account)
        return Promise.reject (new BadRequestError ('invalid_username', 'The username does not exist.'));

      if (account.enabled !== true)
        return Promise.reject (new BadRequestError ('account_disabled', 'The account is disabled.'));

      if (account.is_deleted)
        return Promise.reject (new BadRequestError ('account_deleted', 'The account no longer exists.'));

      return account.verifyPassword (password).then (match => {
        if (!match)
          return Promise.reject (new BadRequestError ('invalid_password', 'The password for the account is incorrect.'));

        return account;
      });
    });
  },

  _issueToken (client, account, opts = {}) {
    const { origin, refreshable = true, scope = [] } = opts;

    // If the client has an black and white list, then we need to make sure the
    // account is not in the black list and is in the white list.

    if (!client.allowed (account))
      return Promise.reject (new ForbiddenError ('invalid_account', 'Your account cannot access this client.'));

    // Make sure the account is able to access the client.

    const doc = {
      client : client._id,
      account: account._id,
      scope  : union (client.scope, account.scope, scope),
    };

    if (refreshable)
      doc.refresh_token = new ObjectId ();

    doc.expiration = client.computeExpiration ();

    // Bind the token to the origin if present. The origin is used by other parts
    // of the framework to ensure the token is not been hijacked.

    if (!!origin)
      doc.origin = origin;

    return this.UserToken.create (doc);
  },
});
