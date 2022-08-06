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
  service,
  env,
  ForbiddenError,
  BadRequestError
} = require ('@onehilltech/blueprint');

/**
 * @class VerificationController
 *
 * The controller for verifying user accounts.
 */
module.exports = Controller.extend ({
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
          optional: { options: { nullable: true } },
          isURL: {
            errorMessage: 'This field is not a URL.',
            options: [{require_tld: env === 'production'}]
          }
        }
      },

      /// Reference to the verification service.
      verification: service (),

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
      async execute (req, res) {
        const { token, redirect } = req.query;

        try {
          // Verify the account using the provided token.
          const account = await this.verification.verify (token, req);

          // Notify all the account has been verified.
          await this.emit ('gatekeeper.account.verified', account);

          if (redirect)
            res.redirect (301, `${redirect}?account=${account.id}`);
          else
            res.status (200).json ({message: `The account for ${account.email} has been verified.`});
        }
        catch (err) {
          if (err.name === 'TokenExpiredError')
            throw new ForbiddenError ('token_expired', 'The access token has expired.');

          if (err.name === 'JsonWebTokenError')
            throw new ForbiddenError ('invalid_token', err.message);

          throw new BadRequestError ('verification_failed', err.message);
        }
      }
    })
  }
});
