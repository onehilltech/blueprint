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

const { model, BadRequestError, service, Action } = require ('@onehilltech/blueprint');
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
    const { usernameIsEmail = false, normalizeEmail = true } = gatekeeper;

    let schema = {
      'account.email': {
        in: ['body'],
        errorMessage: 'Not a valid email address.',
        isEmail: true,
        normalizeEmail
      }
    };

    if (usernameIsEmail) {
      schema['account.username'] = {
        in: ['body'],
        errorMessage: 'Not a valid email address.',
        isEmail: true,
        normalizeEmail
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
          return await this._super.call (this, ...arguments);
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
          custom: {
            options: this.app.lookup ('validator:isMongoIdOrMe'),
            errorMessage: 'The id is not valid.',
          }
        }
      },

      getId (req, id) {
        return id === 'me' ? req.user._id : id;
      },

      /**
       * @override
       */
      prepareResponse (req, res, result) {
        const { account } = result;

        // Prepare the response. We are going to remove the verification sub-document,
        // and only return of the account has been verified.
        const obj = account.toObject ();
        obj.verified = account.verified;
        delete obj.verification;

        result.account = obj;

        return result;
      },
    });
  },

  /**
   * @override
   */
  getAll () {
    return this._super.call (this, ...arguments).extend ({
      prepareResponse (req, res, result) {
        const { accounts } = result;

        // Replace the verification document with the verified virtual.
        result.accounts = accounts.map (account => {
          const obj = account.toObject ();
          obj.verified = account.verified;
          delete obj.verification;

          return obj;
        });

        return result;
      }
    })
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
   * Change the password for the user.
   *
   * @returns {*}
   */
  changePassword () {
    return this.SingleResourceAction.extend ({
      schema: {
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

      /// Reference to the mailer service for sending emails.
      mailer: service (),

      async executeFor (account, req, res) {
        // Verify the current password. If the password does not match, then we can
        // just return error message to the client, and stop processing the request.

        const { password: { current: currentPassword, new: newPassword }} = req.body;
        const match = await account.verifyPassword (currentPassword);

        if (!match)
          throw new BadRequestError ('invalid_password', 'The current password is invalid.');

        // Update the old password with the new password. After we change the password,
        // we are going to send out notifications.

        account.password = newPassword;
        await account.save ();

        await this.emit ('gatekeeper.password.changed', account);
        await this.mailer.send ('gatekeeper.password.changed', {
          message: {
            to: account.email
          },
          locals: {
            account
          }
        });

        return res.status (200).json (true);
      }
    });
  },

  /**
   * Allow the current user to impersonate the target account.
   */
  impersonate () {
    return this.SingleResourceAction.extend ({
      /// The session service for generating tokens.
      session: service (),

      async executeFor (account, req, res) {
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
    return this.SingleResourceAction.extend ({
      async executeFor (account, req, res) {
        // Update the verification information for the account.
        account.verification.date = new Date ();
        account.verification.ip_address = req.ip;
        await account.save ();

        // Let's also send a real-time notification to the client.
        await this._emitIO (account);

        return res.status (200).json ({ account });
      },

      async _emitIO (account) {
        const { configs: { gatekeeper: { io: bucket } } } = this.app;

        if (!!bucket) {
          const io = this.app.lookup ('service:io').connection (bucket);
          await io.to (account.id).emit ('verified');
        }
      }
    });
  },

  /**
   * Resend the verification email for the account.
   */
  resend () {
    return this.SingleResourceAction.extend ({
      // Reference to the verification service.
      verification: service (),

      async executeFor (account, req, res) {
        if (account.verified)
          throw new BadRequestError ('already_verified', 'The account has already been verified');

        // Send the verification email for this account.
        account = await this.verification.sendEmail (account, req.accessToken.client);

        return res.status (200).json ({ account });
      }
    });
  }
});
