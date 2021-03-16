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

const { model } = require ('@onehilltech/blueprint');
const { ResourceController } = require ('@onehilltech/blueprint-gatekeeper');

/**
 * @class FirebaseMessaging
 *
 * Controller for managing devices and tokens for firebase messaging.
 */
module.exports = ResourceController.extend ({
  namespace: 'firebase',
  Model: model ('firebase-device'),

  create () {
    return this._super.call (this, ...arguments).extend ({
      schema: {
        'device.account': {
          optional: true
        },

        'device.client': {
          optional: true
        }
      },

      prepareDocument (req, doc) {
        const { user, accessToken } = req;

        doc.client = accessToken.client._id;
        doc.account = user._id;
        doc.session = accessToken._id;

        return doc;
      }
    })
  }
});
