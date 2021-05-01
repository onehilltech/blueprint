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
const { service, BadRequestError } = require ('@onehilltech/blueprint');
const { merge, omit } = require ('lodash');

const ModelVisitor = require ('../../models/-visitor');

/**
 * @class RefreshToken
 *
 * Granter for the refresh_token strategy.
 */
module.exports = Granter.extend ({
  name: 'temp',
  issuer: service (),

  schemaFor (client) {
    let schema = merge ({
      access_token: {
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
        // response when issuing a temp token.
        delete schema.recaptcha;
      }
    }));

    return schema;
  },

  onCreateToken (req) {
    // First, we are going to verify the token is valid. Once we have verified the
    // validity of the refresh token, we can locate the access token that corresponds
    // to the refresh token. If we can locate the access token, then we can generate
    // a new access token for the user.
    return this.issuer.verifyToken (req.body.access_token)
      .then (accessToken => {
        const { options, payload } = req.body;

        // Delete the options that are not allowed.
        let opts = omit (options, ['algorithm', 'jwtid', 'expiresIn']);

        switch (accessToken.type) {
          case 'user_token':
            return this.issuer.issueUserToken (accessToken.account, accessToken.client, payload, opts, false);

          case 'client_token':
            return this.issuer.issueClientToken (accessToken.client, payload, opts, false);

          default:
            return Promise.reject (new BadRequestError ('invalid_token', 'This token cannot create temporary tokens.'));
        }
      });
  }
});
