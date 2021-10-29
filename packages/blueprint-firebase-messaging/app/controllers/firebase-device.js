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

const { model, BadRequestError } = require ('@onehilltech/blueprint');
const { ResourceController } = require ('@onehilltech/blueprint-gatekeeper');

/**
 * @class FirebaseMessaging
 *
 * Controller for managing devices and tokens for firebase messaging.
 */
module.exports = ResourceController.extend ({
  namespace: 'firebase',
  Model: model ('firebase-device'),

  /**
   * Specialize the query operation to support lookup if a device for the given token.
   */
  getAll () {
    return this._super.call (this, ...arguments).extend ({
      getFilter (req, query) {
        // Right now, we only allow this request if you provide the token. This means that
        // we should only get a single device for each request.

        if (!query.token)
          throw new BadRequestError ('missing_parameter', 'You must provide the token query parameter');

        // Add current user id to the query. We use the user id and not the session id because
        // the saved session id may not be the same as the one us to authorize the request.
        query.account = req.user._id;

        return query;
      }
    });
  },

  /**
   * Create a document in the collection.
   *
   * @returns {*}
   */
  create () {
    return this._super.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        const { user, accessToken } = req;

        // Initialize the document with information about the current user.
        doc.client = accessToken.client._id;
        doc.account = user._id;
        doc.session = accessToken._id;

        return doc;
      }
    });
  },

  /**
   * Update a single document in the collection.
   */
  update () {
    return this._super.call (this, ...arguments).extend ({
      getUpdate (req, update) {
        // The only property that can be provided in the update is the token. We are also
        // going to update the session property just in case the token has been refreshed.

        update.$set.session = req.accessToken._id;

        return update;
      }
    });
  }
});
