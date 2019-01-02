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
  BadRequestError,
  model,
  service,
} = require ('@onehilltech/blueprint');

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

  runCheck (req) {
    const origin = req.get ('origin');
    const { response } = req.query;

    return this.Client.findOne ({origin})
      .then (client => {
        if (!client)
          return Promise.reject (new BadRequestError ('invalid_client', 'The client is unknown.'));

        // Make a request to google, and verify the response.
        return this.recaptcha.verifyResponse (client.recaptcha_secret, response, req.ip);
      })
      .then (result => result.success);
  }
});
