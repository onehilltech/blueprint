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

const Granter = require ('../granter');
const { model, ForbiddenError, BadRequestError } = require ('@onehilltech/blueprint');

const {
  Types: { ObjectId }
} = require ('@onehilltech/blueprint-mongodb');

const { merge } = require ('lodash');
const ModelVisitor = require ('../../models/-visitor');

/**
 * @class RefreshToken
 *
 * Granter for the refresh_token strategy.
 */
module.exports = Granter.extend ({
  name: 'refresh_token',

  UserToken: model ('user-token'),

  schemaFor (client) {
    let schema = merge ({
      refresh_token: {
        in: 'body',
        isLength: {
          options: {min: 1},
          errorMessage: 'This field is required.'
        }
      }

    }, this._super.call (this, client));

    client.accept (new ModelVisitor ({
      visitRecaptchaClient () {
        // Due to the expected behavior of reCAPTCHA, we do not require a recaptcha
        // response refreshing the access token.
        delete schema.recaptcha;
      }
    }));

    return schema;
  },

  createToken (req) {
    const refreshToken = req.body.refresh_token;
    const {gatekeeperClient} = req;

    // First, we are going to verify the token is valid. Once we have verified the
    // validity of the refresh token, we can locate the access token that corresponds
    // to the refresh token. If we can locate the access token, then we can generate
    // a new access token for the user.
    return this.tokenGenerator.verifyToken (refreshToken)
      .then (payload => {
        const {jti} = payload;
        const refresh_token = new ObjectId (jti);
        const client = gatekeeperClient._id;

        return this.UserToken.findOne ({refresh_token, client}).populate ('client account').exec ();
      })
      .then (accessToken => {
        // Make sure the access token exists, and both the client and account for the
        // access token are not disabled.
        if (!accessToken)
          return Promise.reject (new ForbiddenError ('invalid_token', 'The refresh token does not exist, or does not belong to the client.'));

        if (!accessToken.enabled)
          return Promise.reject (new ForbiddenError ('token_disabled', 'The refresh token is disabled.'));

        if (!accessToken.client.enabled)
          return Promise.reject (new ForbiddenError ('client_disabled', 'The client is disabled.'));

        if (accessToken.account) {
          // The access token is for a user account. There are more checks that
          // we need to execute, such as checking if the account is enabled.

          if (!accessToken.account.enabled)
            return Promise.reject (new ForbiddenError ('account_disabled', 'The account is disabled.'));
        }

        return accessToken.remove ().then (accessToken => {
          const doc = {
            client : accessToken.client._id,
            account: accessToken.account._id,
            scope  : accessToken.scope,
            origin : accessToken.origin,
            refresh_token: new ObjectId ()
          };

          return this.UserToken.create (doc);
        });
      })
      .catch (err => {
        // Process the error message. We have to check the name because the error
        // could be related to token verification.
        if (err.name === 'TokenExpiredError')
          err = new ForbiddenError ('token_expired', 'The refresh token has expired.');

        if (err.name === 'JsonWebTokenError')
          err = new ForbiddenError ('invalid_token', 'The refresh token is invalid.');

        return Promise.reject (err);
      });
  }
});
