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
  Types: {ObjectId}
} = require ('@onehilltech/blueprint-mongodb');

const {
  Action,
  BadRequestError,
  model,
  service
} = require ('@onehilltech/blueprint');

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
      prepareDocument (req, doc) {
        if (doc.token)
          delete doc.token;

        doc.client = req.user._id;

        return doc;
      }
    })
  },

  /**
   * Remove a device from the database. Once the device has been removed, it
   * can no longer be communicated with.
   */
  removeDevice () {
    return Action.extend ({
      execute (req, res) {
        return req.device.remove ().then (() => {
          res.status (200).json (true);
        });
      }
    });
  },

  /**
   * Refresh the token that allows Firebase to communicate with the device.
   */
  refreshToken () {
    return Action.extend ({
      schema: {
        'device.token': {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        }
      },

      execute (req, res) {
        let {device} = req;
        device.token = req.body.device.token;

        return device.save ().then (device => {
          if (!device)
            return Promise.reject (new BadRequestError ('missing_device', 'The device no longer exists.'));

          res.status (200).json ({device: device});
        });
      }
    });
  },

  /**
   * Claim an existing device.
   */
  claimDevice () {
    return Action.extend ({
      fcm: service (),

      schema: {
        'device.device': {
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        }
      },

      execute (req, res) {
        let deviceToken = req.body.device.device;

        return this.fcm.verifyToken (deviceToken)
          .then (payload => {
            const update = {user: req.user._id};
            return this.controller.Model.findByIdAndUpdate (payload.jti, update, {new: true});
          })
          .then (device => {
            if (!device)
              return Promise.reject (new BadRequestError ('not_found', 'The device does not exist.'));

            let ret = device.toObject ();
            delete ret.id;

            res.status (200).json ({device: ret});
          });
      }
    });
  },

  /**
   * Unclaim an previously claimed device.
   */
  unclaimDevice () {
    return Action.extend ({
      fcm: service (),

      schema: {
        'device.device': {
          isLength: {
            options: {min: 1},
            errorMessage: 'This field is required.'
          }
        }
      },

      execute (req, res) {
        let deviceToken = req.body.device.device;

        return this.fcm.verifyToken (deviceToken)
          .then (payload => {
            const selection = {_id: new ObjectId (payload.jti), user: req.user._id};
            const update = {$unset: {user: ''}};

            return this.controller.Model.findOneAndUpdate (selection, update, {new: true});
          })
          .then (device => {
            if (!device)
              return Promise.reject (new BadRequestError ('not_found', 'The device does not exist, or the user does not own the device.'));

            let ret = device.toObject ();
            delete ret.id;

            res.status (200).json ({device: ret});
          });
      }
    });
  }
});
