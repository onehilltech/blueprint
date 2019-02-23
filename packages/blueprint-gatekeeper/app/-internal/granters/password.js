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

const { model, service, BadRequestError, ForbiddenError } = require ('@onehilltech/blueprint');
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

  /// The account model definition.
  Account: model ('account'),

  /// The user token definition.
  UserToken: model ('user-token'),

  /// The service for verifying reCAPTCHA.
  recaptcha: service (),

  init () {
    this._super.call (this, ...arguments);
  },

  /**
   * Create the UserToken for the request.
   *
   * @param req
   * @returns {doc}
   */
  createToken (req) {
    const {gatekeeperClient: client} = req;

    // We need to locate the account for the username, and check that the
    // provided password is correct. We also need to make sure the account
    // has not been disabled before we create the token.

    return this.findAccount (req).then (account => {
      // If the client has an black and white list, then we need to make sure the
      // account is not in the black list and is in the white list.

      if (!client.allowed (account))
        return Promise.reject (new ForbiddenError ('invalid_account', 'Your account cannot access this client.'));

      const origin = req.get ('origin');

      // Make sure the account is able to access the client.

      const doc = {
        client : client._id,
        account: account._id,
        scope  : union (client.scope, account.scope),
        refresh_token: new ObjectId ()
      };

      if (!!client.expiration) {
        // Compute the expiration date for the access token. The expiration statement
        // in the client is a a relative time phrase (i.e., 1 day, 60 seconds, etc).

        let parts = client.expiration.split (' ');
        doc.expiration = moment ().add (...parts).toDate ();
      }

      // Bind the token to the origin if present. The origin is used by other parts
      // of the framework to ensure the token is not been hijacked.

      if (!!origin)
        doc.origin = origin;

      return this.UserToken.create (doc);
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
  }
});
