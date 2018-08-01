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
  model,
  NotFoundError,
  BadRequestError,
  service,
  Action
} = require ('@onehilltech/blueprint');

const { get } = require ('lodash');
const { ResourceController } = require ('@onehilltech/blueprint-mongodb');

/**
 * @class AccountController
 */
module.exports = ResourceController.extend ({
  namespace: 'gatekeeper',

  Model: model ('account'),

  create () {
    return this._super.call (this, ...arguments).extend ({
      gatekeeper: service (),

      _tokenGenerator: null,
      _refreshTokenGenerator: null,

      init () {
        this._super.call (this, ...arguments);

        this._tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:access_token');
        this._refreshTokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:refresh_token');
      },

      prepareDocument (req, doc) {
        // Prevent the client from setting the id.
        if (doc._id)
          delete doc._id;

        return doc;
      },

      createModel (req, doc) {
        // Allow the controller to create the model. If the creation fails because of a
        // duplicate email address, then we need to check if the account has been deleted.
        // If the account has been deleted, then we need to restore the account.

        return this._super.call (this, ...arguments)
          .catch (err => {
            switch (err.code) {
              case 11000:
                // The email address for the account is a duplicate. If the account is marked
                // as deleted, then we need to restore the account.
                return this._restoreIfDeleted (req, doc);

              default:
                return Promise.reject (err);
            }
          });
      },

      _restoreIfDeleted (req, doc) {
        const selection = {email: doc.email, '_stat.deleted_at': {$exists: true}};
        const update = {
          $set: {
            'verification.required': true
          },
          $unset: {
            '_stat.deleted_at': ''
          }
        };

        return this.controller.Model.findOneAndUpdate (selection, update, {new: true}).then (account => {
          return !!account ? account : Promise.reject (new BadRequestError ('already_exists', 'The account already exists.'));
        });
      },

      prepareResponse (req, res, result) {
        // If the origin request wanted to login the user, then we need to
        // return to login the user for the account and return the access
        // token for the corresponding login.

        const login = get (req.query, 'login', false);

        if (!login)
          return result;

        req.gatekeeperClient = req.user;
        req.account = result.account;

        let tokenController = this.controller.app.lookup ('controller:oauth2.token');
        const password = get (tokenController, 'granters.password');

        return password.createToken (req)
          .then (accessToken => accessToken.serialize (this._tokenGenerator, this._refreshTokenGenerator))
          .then (accessToken => {
            result.token = Object.assign ({token_type: 'Bearer'}, accessToken);
            return result;
          });
      }
    });
  },

  getOne () {
    return this._super.call (this, ...arguments).extend ({
      schema: {
        [this.resourceId]: {
          in: 'params',
          isMongoId: false,
          isMongoIdOrMe: true
        }
      },

      getId (req, id) {
        return id === 'me' ? req.user._id : id;
      }
    });
  },

  changePassword () {
    return Action.extend ({
      schema: {
        [this.resourceId]: {
          in: 'params',
          isMongoIdOrMe: true,
          toMongoId: true
        },

        'password.current': {
          in: 'body',
          isLength: {
            options: {min: 1}
          }
        },

        'password.new': {
          in: 'body',
          isLength: {
            options: {min: 1}
          }
        }
      },

      execute (req, res) {
        const currentPassword = req.body.password.current;
        const newPassword = req.body.password.new;
        const {accountId} = req.params;

        return this.controller.Model.findById (accountId)
          .then (account => {
            if (!account)
              return Promise.reject (new NotFoundError ('unknown_account', 'The account does not exist.'));

            return account.verifyPassword (currentPassword)
              .then (match => {
                // If the password does not match, then we can just return an
                // error message to the client, and stop processing the request.
                if (!match)
                  return Promise.reject (new BadRequestError ('invalid_password', 'The current password is invalid.'));

                account.password = newPassword;
                return account.save ();
              })
              .then (() => {
                res.status (200).json (true);
              });
          });
      }
    });
  }
});
