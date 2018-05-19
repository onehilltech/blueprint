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

const { Listener, computed, service } = require ('@onehilltech/blueprint');
const path  = require ('path');
const Email = require ('email-templates');
const {omit, merge, get, defaultsDeep} = require ('lodash');

// TODO Construct the real location of the template directory.
let templateDir = path.resolve (__dirname, '../../resources/email');

const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

const DEFAULT_EMAIL_OPTIONS = {
  views: {
    options: {
      extension: 'ejs'
    }
  }
};

const OVERRIDE_EMAIL_OPTIONS = {
  views: {
    root: templateDir
  }
};

/**
 * Send an activation email to the newly created account.
 */
module.exports = Listener.extend ({
  gatekeeper: service (),

  _email: null,
  _activationConfig: null,
  _tokenGenerator: null,

  init () {
    this._super.call (this, ...arguments);

    this._appConfig = this.app.lookup ('config:app');
    this._gatekeeperConfig = this.app.lookup ('config:gatekeeper');
    this._activationConfig = get (this._gatekeeperConfig, 'activation');

    if (!this._gatekeeperConfig.email)
      console.warn ('gatekeeper: no email configured; not sending activation emails');

    this._tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:account_verification');

    // Create the email template for the activation email while preventing the
    // application from changing the location of the email templates.
    let opts = merge (DEFAULT_EMAIL_OPTIONS, omit (this._gatekeeperConfig.email, ['locals']), OVERRIDE_EMAIL_OPTIONS);

    this._email = new Email (opts);
  },

  hasEmail: computed ({
    get () { return !!this._gatekeeperConfig.email }
  }),

  handleEvent (account) {
    if (!this.hasEmail || !this._activationConfig)
      return;

    // Generate an activation token. This token will be added to the email.
    const payload = {};
    const options = {jwtid: account.id};

    return this._tokenGenerator.generateToken (payload, options)
      .then (token => {
        let opts = {
          template: 'account.activation',
          message: {
            to: account.email
          },
          locals: defaultsDeep ({
            appName: this._appConfig.name,
            gatekeeperBaseUri: this._gatekeeperConfig.baseUrl,
            account: {
              id: account.id,
              verificationToken: token
            }
          }, this._gatekeeperConfig.email.locals, {style: DEFAULT_STYLE})
        };

        return this._email.send (opts);
      })
      .then (info => {
        return this.app.emit ('gatekeeper.email.account_activation.sent', account, info);
      });
  },
});
