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
  Policy,
  BadRequestError,
  model,
  service
} = require ('@onehilltech/blueprint');

/**
 * @class BearerPolicy
 *
 * Bearer policy for the device token.
 */
module.exports = Policy.extend ({
  fcm: service (),

  FirebaseDevice: model ('firebase-device'),

  runCheck (req) {
    let authorization = req.get ('authorization');

    if (!authorization)
      return Promise.reject (new BadRequestError ('missing_token', 'The request is missing the device token.'));

    let [scheme,token] = authorization.split (' ');

    if (scheme !== 'Bearer')
      return Promise.reject (new BadRequestError ('bad_protocol', 'The request has an unsupported authorization protocol.'));

    return this.fcm.verifyToken (token)
      .then (payload => this.FirebaseDevice.findById (payload.jti))
      .then (device => {
        if (!device)
          return {failureCode: 'invalid_device', failureMessage: 'The device for the request does not exist.'};

        req.device = device;

        return true;
      });
  }
});
