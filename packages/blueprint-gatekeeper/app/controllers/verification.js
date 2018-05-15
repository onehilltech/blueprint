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
  Controller,
  Action,
  model,
  service,
  env,
  ForbiddenError
} = require ('@onehilltech/blueprint');

/**
 * @class VerificationController
 *
 * The controller for verifying user accounts.
 */
module.exports = Controller.extend ({
  /// The account model.
  Account: model ('account'),

  /// The gatekeeper service with the token generators.
  gatekeeper: service (),

  /// The token generator for used to verify account verification tokens.
  _tokenGenerator: null,

  init () {
    this._super.call (this, ...arguments);
    this._tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:account_verification');
  },

  /**
   * The one and only action of the controller that verifies an account.
   *
   * @return {*}
   * @private
   */
  __invoke () {
    return Action.extend ({
      schema: {
        token: {
          in: 'query',
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        },

        redirect: {
          in: 'query',
          isURL: {
            errorMessage: 'This field is not a URL.',
            options: [{require_tld: env === 'production'}]
          }
        }
      },

      /**
       * Execute the action.
       *
       * The execution of the action involves the following steps. First, we decode the
       * provided token. If the token is valid, then we use the information in the token
       * to locate the corresponding account.
       *
       * Once we have the account, we make sure it is valid and has not been verified. If
       * this is all good, then we verify the acount
       *
       * @param req
       * @param res
       * @return {*}
       */
      execute (req, res) {
        const {token, redirect} = req.query;

        return this.controller._tokenGenerator.verifyToken (token)
          .then (payload => this.controller.Account.findById (payload.jti))
          .then (account => {
            // Let's make sure the account exist, the account is not disabled, and
            // the account has not been verified.
            if (!account)
              return Promise.reject (new ForbiddenError ('unknown_account', 'The account is unknown.'));

            if (!account.enabled)
              return Promise.reject (new ForbiddenError ('account_disabled', 'The account is disabled.'));

            if (!!account.verification.date)
              return Promise.reject (new ForbiddenError ('already_verified', 'The account has already been verified.', {verification: account.verification}));

            // Save the verification details.
            account.verification.date = new Date ();
            account.verification.ip_address = req.ip;

            return account.save ();
          })
          .then (account => this.emit ('gatekeeper.account.verified', account))
          .then (() => res.redirect (301, redirect))
          .catch (err => {
            // Translate the error, if necessary. We have to check the name because the error
            // could be related to token verification.
            if (err.name === 'TokenExpiredError')
              err = new ForbiddenError ('token_expired', 'The access token has expired.');

            if (err.name === 'JsonWebTokenError')
              err = new ForbiddenError ('invalid_token', err.message);

            return Promise.reject (err);
          });
      }
    })
  }
});
