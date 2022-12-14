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

const {
  Policy,
  model,
  service,
} = require ('@onehilltech/blueprint');

const RECAPTCHA_SCHEME_REGEXP = /^recaptcha$/i;

/**
 * Policy that verifies a Google recaptcha response.
 *
 * The Google recaptcha response is expected to be in a query parameter named `response`.
 */
module.exports = Policy.extend ({
  /// The access token model.
  Client: model ('client'),

  /// Load the recaptcha service.
  recaptcha: service (),

  async runCheck (req) {
    const authorization = req.get ('authorization');

    if (!authorization)
      return { failureCode: 'invalid_authorization', failureMessage: 'The authorization header is missing.' };

    const [scheme, response] = authorization.split (' ');

    if (!RECAPTCHA_SCHEME_REGEXP.test (scheme))
      return { failureCode: 'invalid_authorization', failureMessage: 'The authorization scheme is invalid.' };

    const origin = req.get ('origin');
    const client = await this.Client.findOne ({ origin });

    if (!client)
      return { failureCode: 'unknown_client', failureMessage: 'The client is unknown.' };
    ;

    // Make a request to google, and verify the response.
    const result = await this.recaptcha.verifyResponse (client.recaptcha_secret, response, req.ip);
    return result.success;
  }
});
