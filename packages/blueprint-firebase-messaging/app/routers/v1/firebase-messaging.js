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
  policies: { all, check }
} = require ('@onehilltech/blueprint');

module.exports = {
  '/firebase': {
    '/devices': {
      resource: {
        controller: 'firebase-messaging',
        allow: ['create'],
      },

      /*
       * Delete the registration for a device.
       */
      delete: {
        policy: 'firebase.device.bearer',
        action: 'firebase-messaging@removeDevice',
      },

      '/tokens': {
        policy: 'firebase.device.bearer',

        /*
         * Refresh the device token. This is the token that is provided by the Firebase
         * SDK to the client application.
         */
        post: {action: 'firebase-messaging@refreshToken'}
      },

      '/claims': {
        policy: all.ordered ([
          check ('gatekeeper.auth.bearer'),
          check ('gatekeeper.request.user')
        ], 'unauthorized_claim', 'The request is not authorized to manage the device claim.'),

        /*
         * Claim an existing device.
         */
        post: {action: 'firebase-messaging@claimDevice'},

        /*
         * Delete the claim for an existing device.
         */
        delete: {action: 'firebase-messaging@unclaimDevice'}
      }
    }
  }
};
