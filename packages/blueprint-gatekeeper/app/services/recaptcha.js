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

const { Service, BadRequestError } = require ('@onehilltech/blueprint');
const rp = require ('request-promise-native');

const VERIFY_METHOD = 'GET';
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * @class RecaptchaService
 */
module.exports = Service.extend ({
  verifyResponse (secret, response, ip) {
    // Send a request ot Google asking them to validate the request.
    const options = {
      method: VERIFY_METHOD,
      url: VERIFY_URL,
      json: true,
      qs: {
        secret: secret,
        response,
        remoteip: ip
      }
    };

    return rp (options).then (result => {
      const {success} = result;

      if (success)
        return result;

      return Promise.reject (new BadRequestError ('recaptcha_failed', 'Failed to verify the reCAPTCHA response.', {'error-codes': result['error-codes']}));
    });
  }
});
