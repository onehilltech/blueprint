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
const ResourceController = require ('../../../lib/resource-controller');

/**
 * @class AccountController
 */
module.exports = ResourceController.extend ({
  namespace: 'gatekeeper',

  Model: model ('account'),

  create () {
    const { gatekeeper } = this.app.configs;
    const { usernameIsEmail = false } = gatekeeper;

    let schema = {
      'account.email': {
        in: ['body'],
        errorMessage: 'Not a valid email address.',
        isEmail: true,
        normalizeEmail: true
      }
    };

    if (usernameIsEmail) {
      schema['account.username'] = {
        in: ['body'],
        errorMessage: 'Not a valid email address.',
        isEmail: true,
        normalizeEmail: true
      }
    }

    return this._super.call (this, ...arguments).extend ({
      session: service (),
      account: service (),
      verification: service (),

      // Extend the default schema.
      schema,

      prepareDocument (req, doc) {
        if (doc._id) {
          // Prevent the client from setting the id.
          delete doc._id;
        }

        // Allow the application to create its own id for the account. This is useful if the
        // application needs to assign an existing id to an account. We do not have to worry
        // about duplicate account ids.
        return this.prepareId (doc);
      },

      prepareId (doc) {
        return this.account.prepareId (doc);
      },

      async createModel (req, doc) {
        // Allow the controller to create the model. If the creation fails because of a
        // duplicate email address, then we need to check if the account has been deleted.
        // If the account has been deleted, then we need to restore the account.

        try {
          return this._super.call (this, ...arguments);
        }
        catch (err) {
          if (err.code !== 11000)
            throw err;

          // Extract the index that caused the duplicate key error. This will determine
          // the best course of action for correcting the problem.

          const [, field] = err.message.match (/index:\s+(\w+)_\d*/);

          // Since we got a duplicate exception, this means an account with either the
          // username or email address already exists. Let's attempt to restore the
          // account if the account is deleted.

          const selection = {[field]: doc[field], '_stat.deleted_at': {$exists: true}};

          const update = {
            $unset: { '_stat.deleted_at': '' }
          };

          const account = await this.controller.Model.findOneAndUpdate (selection, update, {new: true});

          if (!!account)
            return account;

          throw new BadRequestError (`${field}_exists`, `An account with this ${field} already exists.`);
        }
      },

      async postCreateModel (req, account) {
        // The account model has been successfully created. Let's send an account verification
        // email for the account to the email address associated with this account.
        const { client } = req.accessToken;

        if (!!account.verification && !!account.verification.required && !!client.verify_account_url)
          await this.verification.sendEmail (account, client);

        return account;
      },

      async prepareResponse (req, res, result) {
        // If the origin request wanted to login the user, then we need to
        // return to login the user for the account and return the access
        // token for the corresponding login.

        const login = get (req.query, 'login', false);

        if (!login)
          return result;

        const { origin } = req;
        const payload = {};
        const options = { origin, refreshable: true };

        const token = await this.session.issueToken (req.user, result.account, payload, options);
        return Object.assign (result, { token: Object.assign ({}, token, { token_type: 'Bearer' }) });
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
  authenticate () {
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
    });
  },

  /**
   * Allow the current user to impersonate the target account.
   */
  impersonate () {
    return Action.extend ({
      /// The session service for generating tokens.
      session: service (),

      async execute (req, res) {
        const { accountId } = req.params;

        const account = await this.controller.Model.findById (accountId);
        const payload = { impersonator: req.user.id };
        const options = { scope: ['gatekeeper.session.impersonation'] };

        const token = await this.session.issueToken (req.accessToken.client._id, account, payload, options);

        return res.status (200).json (Object.assign ({token_type: 'Bearer'}, token));
      }
    });
  },

  /**
   * The current user is verifying (or activating) their account.
   */
  verify () {
    return Action.extend ({
      execute (req, res) {
        const { Model } = this.controller;
        const { accountId } = req.params;

        let update = {
          'verification.date': new Date (),
          'verification.ip_address': req.ip
        };

        return Model.findByIdAndUpdate (accountId, update, { new: true })
          .then (account => !!account ? res.status (200).json ({ account }) : Promise.reject (new NotFoundError ('not_found', 'The account does not exist.')));
      }
    });
  }
});
