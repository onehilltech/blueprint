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

const { Service, model, computed } = require ('@onehilltech/blueprint');
const { get, forOwn, merge, transform } = require ('lodash');
const Email = require ('email-templates');
const path = require ('path');

const TokenGenerator = require ('../../lib/token-generator');

const DEFAULT_BASE_OPTIONS = {
  issuer: 'gatekeeper',
};

const BUILTIN_TOKEN_GENERATORS = {
  'gatekeeper:access_token': {

  },

  'gatekeeper:refresh_token': {

  },

  'gatekeeper:account_verification': {

  },

  'gatekeeper:password_reset': {

  }
};

const DEFAULT_EMAIL_OPTIONS = {
  views: {
    options: {
      extension: 'ejs'
    }
  }
};

/**
 * @class GatekeeperService
 *
 * The service allows clients to perform system-level operations related to
 * authentication and authorization.
 */
module.exports = Service.extend ({
  /// The default token generator used by the service.
  _tokenGenerator: null,

  /// The base options used by all token generators.
  _baseOptions: null,

  /// Collection of named token generators.
  _tokenGenerators: {},

  _granters: null,

  _email: null,

  Client: model ('client'),

  init () {
    this._super.call (this, ...arguments);

    const config = this.app.lookup ('config:gatekeeper');
    this._parseConfiguration (config);

    Object.defineProperty (this, 'tokenGenerator', {
      get () { return this._tokenGenerator; }
    });

    Object.defineProperty (this, 'tokenGenerators', {
      get () { return this._tokenGenerators; }
    });
  },

  configure () {
    const { gatekeeper } = this.app.configs;

    this._configureEmail (gatekeeper);
  },

  /**
   * Configure the email service for the module.
   *
   * @private
   */
  _configureEmail (gatekeeper) {
    if (gatekeeper.email === false) {
      return;
    }

    let opts = merge (this.defaultEmailOptions, gatekeeper.email, {
      views: {
        root: path.resolve (__dirname, '../resources/email')
      },
    });

    this._email = new Email (opts);
  },

  defaultEmailOptions: computed ({
    get () {
      return {
        views: {
          options: {
            extension: 'ejs'
          },
          locals: {
            appName: this.app.lookup ('config:app').name,
            activateButton: {
              label: 'Activate account'
            },
            style: {
              primaryColor: '#4CAF50',
            }
          }
        }
      }
    }
  }),

  start () {
    const tokenGenerator = this._tokenGenerators['gatekeeper:access_token'];
    const Granters = require ('../-internal/granters');

    this._granters = transform (Granters, (results, Granter) => {
      let granter = new Granter ({app: this.app, tokenGenerator});
      results[granter.name] = granter;
    }, {});
  },

  /**
   * Parse the configuration, and initialize the service.
   *
   * @param config
   * @private
   */
  _parseConfiguration (config = {}) {
    // Load the base options from the configuration file. We will use the base
    // options to create the default token generator for the service.

    this._baseOptions = merge ({}, DEFAULT_BASE_OPTIONS, get (config.tokens, '$', {}));
    this._tokenGenerator = new TokenGenerator ({options: this._baseOptions});

    // Create the named token generators. This includes the builtin token generators
    // and the ones defined in the configuration file. We allow the user to override
    // some of the default configuration values for the built-in token generators.
    let tokenConfigs = merge ({}, BUILTIN_TOKEN_GENERATORS, config.tokens || {});

    forOwn (tokenConfigs, (config, name) => {
      if (name === '$')
        return;

      // The name of the configuration is the subject. This is the one
      // parameter we do not allow the user to override.
      let tokenConfig = merge ({}, config, {subject: name});

      this.makeNamedTokenGenerator (name, tokenConfig);
    }, this._tokenGenerators);
  },

  /**
   * Make a token generator, and cache it.
   *
   * @param name
   * @param options
   * @return {*}
   */
  makeNamedTokenGenerator (name, options = {}) {
    let tokenGenerator = this.makeTokenGenerator (options);
    this._tokenGenerators[name] = tokenGenerator;

    return tokenGenerator;
  },

  /**
   * Get a named token generator.
   *
   * @param name          Name of the token generator.
   */
  getTokenGenerator (name) {
    return get (this._tokenGenerators, name);
  },

  /**
   * Make a new token generator.
   *
   * @param options
   * @returns {*}
   */
  makeTokenGenerator (options = {}) {
    return this._tokenGenerator.extend ({options});
  },

  /**
   * Generate a token.
   *
   * @param payload       Payload to encode
   * @param opts          Additional options
   */
  generateToken (payload, opts = {}) {
    return this._tokenGenerator.generateToken (payload, opts);
  },

  /**
   * Verify a token. The payload of the token is returned.
   *
   * @param token         Token to verify
   * @param opts          Additional options
   */
  verifyToken (token, opts = {}) {
    return this._tokenGenerator.verifyToken (token, opts);
  },

  /**
   * Send an email from this service.
   *
   * @param opts
   * @returns {*}
   */
  sendEmail (opts) {
    return !!this._email ? this._email.send (opts) : Promise.resolve (false);
  }
});
