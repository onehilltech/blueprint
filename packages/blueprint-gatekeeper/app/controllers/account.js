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
const ResourceController = require ('../../lib/resource-controller');

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
            if (err.code !== 11000)
              return Promise.reject (err);

            // Extract the index that caused the duplicate key error. This will determine
            // the best course of action for correcting the problem.

            const [, field] = err.message.match (/index:\s+(\w+)_\d+/);

            // Since we got a duplicate exception, this means an account with either the
            // username or email address already exists. Let's attempt to restore the
            // account if the account is deleted.

            const selection = {email: doc.email, username: doc.username, '_stat.deleted_at': {$exists: true}};
            const update = {
              $set: {
                'verification.required': true
              },
              $unset: {
                '_stat.deleted_at': ''
              }
            };

            return this.controller.Model.findOneAndUpdate (selection, update, {new: true})
              .then (account => !!account ? account : Promise.reject (new BadRequestError (`${field}_exists`, `An account with this ${field} already exists.`)));
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
  },

  /**
   * Authenticate an existing account. This method is used to authenticate a
   * user who is currently logged into the system.
   */
  authenicate () {
    return Action.extend ({
      schema: {
        'authenticate.password': {
          in: 'body'
        }
      },

      execute (req, res) {
        const { user } = req;
        const { authenticate: { password }} = req.body;

        return user.verifyPassword (password).then (result => res.status (200).json (result));
      }
    })
  }
});
