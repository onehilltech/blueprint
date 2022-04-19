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
  Action,
  Controller,
  model,
  service,
  ForbiddenError,
  BadRequestError
} = require ('@onehilltech/blueprint');

const { defaultsDeep } = require ('lodash');

/**
 * @class PasswordController
 *
 * Controller that has actions related to managing an accounts password.
 */
module.exports = Controller.extend ({
  tokenGenerator: null,

  gatekeeper: service (),
  mailer: service (),

  Account: model ('account'),

  init () {
    this._super.call (this, ...arguments);

    this.tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:password_reset');
  },

  /**
   * The user has forgot their password.
   *
   * First, use the provide email address to locate the account. We then use
   * the located account to generate a special token. The token is then sent
   * to the user so they can reset their password.
   *
   * @return {*}
   */
  forgotPassword () {
    const { gatekeeper } = this.app.configs;
    const { normalizeEmail = true } = gatekeeper;

    return Action.extend ({
      schema: {
        email: {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          },
          isEmail: {
            errorMessage: 'The provided email address is not valid.'
          },
          normalizeEmail
        }
      },

      async execute (req, res) {
        const { email } = req.body;

        if (!req.user.password_reset_url)
          return Promise.reject (new ForbiddenError ('no_password_reset', 'This client is not allowed to reset passwords.'));

        const account = await this.controller.Account.findOne ({email});

        if (!account)
          return Promise.reject (new ForbiddenError ('unknown_account', 'The email address does not have an account.'));

        if (!account.enabled)
          return Promise.reject (new ForbiddenError ('account_disabled', 'The account is disabled.'));

        const payload = { jti: account.id };
        const token = await this.controller.tokenGenerator.generateToken (payload);
        const { accessToken: { client: { password_reset_url }}} = req;
        const url = `${password_reset_url}?token=${token}`;

        // Send the forgot password email to the user.
        await this.controller.mailer.send ('gatekeeper.password.reset', {
          message: {
            to: account.email
          },
          locals: {
            account,
            url,
          }
        });

        return res.status (200).json (true);
      }
    });
  },

  /**
   * The user wants to reset their password. This method works in conjunction with
   * forgotPassword(). We are expecting the query for this request to contain a
   * valid token that was issued by forgotPassword().
   */
  resetPassword () {
    return Action.extend ({
      schema: {
        'reset-password.token': {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        },
        'reset-password.password': {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        }
      },

      /**
       * @override
       */
      async execute (req, res) {
        const {token, password} = req.body['reset-password'];
        const payload = await this._verifyToken (token);
        const account = await this.controller.Account.findById (payload.jti);

        if (!account)
          throw new BadRequestError ('unknown_account', 'The account does not exist.');

        if (!account.enabled)
          throw new BadRequestError ('account_disabled', 'The account is disabled.');

        // Replace the password, and save it. After we save the password, we are going to
        // emit an event and send an email to the account owner.

        account.password = password;
        await account.save ();

        await this.emit ('gatekeeper.password.changed', account);
        await this.controller.mailer.send ('gatekeeper.password.changed', {
          message: {
            to: account.email
          },
          locals: {
            account
          }
        });

        return res.status (200).json (true);
      },

      /**
       * Verify the access token.
       *
       * @param token
       * @private
       */
      async _verifyToken (token) {
        try {
          return await this.controller.tokenGenerator.verifyToken (token);
        }
        catch (err) {
          // Translate the error, if necessary. We have to check the name because the error
          // could be related to token verification.
          if (err.name === 'TokenExpiredError')
            throw new ForbiddenError ('token_expired', 'The access token has expired.');

          if (err.name === 'JsonWebTokenError')
            throw new ForbiddenError ('invalid_token', err.message);

          throw err;
        }
      }
    });
  }
});
