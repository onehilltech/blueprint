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

const debug = require ('debug')('blueprint-greenlock:service:greenlock');

const {
  Service,
  computed,
  Protocol
} = require ('@onehilltech/blueprint');

const path = require ('path');
const assert = require ('assert');

const Greenlock = require ('greenlock');

const DEFAULT_VERSION = 'draft-12';
const SERVER_PRODUCTION = 'https://acme-v02.api.letsencrypt.org/directory';
const SERVER_STAGING = 'https://acme-staging-v02.api.letsencrypt.org/directory';

const DEFAULT_RSA_KEY_SIZE = 2048;

const DEFAULT_HTTP_PORT = 80;
const DEFAULT_HTTPS_PORT = 443;

module.exports = Service.extend ({
  init () {
    this._super.call (this, ...arguments);

    const config = this.app.lookup ('config:greenlock');

    if (config) {
      // Save the configuration. This lets us know that we have enabled support
      // for Greenlock.
      this._config = config;

      if (config.debug)
        this.debug = config.debug;

      // Create our instance of the greenlock agent. After creating the greenlock agent,
      // we can register the custom protocols with the server.
      this._createGreenlock (config);
      this.app.server.registerProtocol ('greenlock', GreenlockProtocol (this));
    }
  },

  configure () {
    if (!this.enabled)
      return;

    return Promise.all ([
      this._configureApproveDomains ()
    ]);
  },

  enabled: computed ({
    get () { return !!this._config; }
  }),

  /**
   * Configure the approve domains strategy.
   *
   * @private
   */
  _configureApproveDomains () {
    let strategy = this._config.approveDomains || 'basic';
    let ApproveDomains;

    switch (strategy) {
      case 'basic':
        const BasicApproveDomains = require ('../../lib/basic-approve-domains');
        ApproveDomains = BasicApproveDomains;
        break;

      case 'custom':
        const fileName = path.resolve (this.app.appPath, 'greenlock/approve-domains');
        ApproveDomains = require (fileName);
        break;

      default:
        return Promise.reject (`${this._config.approveDomains} is not a valid approve domains enumeration.`);
    }

    this._approveDomains = new ApproveDomains ({config: this._config});
  },

  /**
   * Approve the domain connecting to the application.
   *
   * @param options
   * @param certs
   * @param callback
   */
  approveDomains (options, certs, callback) {
    Promise.resolve (this._approveDomains.approveDomains (options, certs))
      .then (result => callback (null, result))
      .catch (callback);
  },

  tempPath: computed ({
    get () { return path.resolve (this.app.tempPath, 'greenlock'); }
  }),

  logsPath: computed ({
    get () { return path.resolve (this.tempPath, 'logs'); }
  }),

  webrootPath: computed ({
    get () { return path.resolve (this.tempPath, 'webroot'); }
  }),

  configDir: computed ({
    get () { return path.resolve (this.tempPath, 'config'); }
  }),

  server: computed ({
    get () { return this.staging ? SERVER_STAGING : SERVER_PRODUCTION; }
  }),

  middleware (f) {
    return this._greenlock.middleware (f);
  },

  tlsOptions: computed ({
    get () { return this._greenlock.tlsOptions; }
  }),

  /**
   * Create the Greenlock class.
   *
   * @private
   */
  _createGreenlock (config = {}) {
    const {
      version = DEFAULT_VERSION,
    } = config;

    let store = this._createStore ();

    this._greenlock = Greenlock.create ({
      version,
      server: this.server,
      store,
      approveDomains: this.approveDomains.bind (this),
      debug: this.debug
    });
  },

  _createStore () {
    // Create the store for LE.
    return require ('le-store-certbot').create ({
      configDir: this.configDir,
      logsDir: this.logsDir,
      webrootPath: this.webrootPath,
      debug: this.debug
    });
  },

  /**
   * Check the registration of the application.
   * s
   * @return {*}
   */
  check () {
    debug ('checking if the application is registered');

    const checkOptions = {
      domains: this._config.domains
    };

    return this._greenlock.check (checkOptions);
  },

  /**
   * Register the application with Let's Encrypt.
   *
   * @private
   */
  register () {
    debug ('registering the application with Let\'s Encrypt');

    let { domains, email, rsaKeySize = DEFAULT_RSA_KEY_SIZE } = this._config;

    if (rsaKeySize < DEFAULT_RSA_KEY_SIZE)
      rsaKeySize = DEFAULT_RSA_KEY_SIZE;

    const options = {
      domains,
      email,
      agreeTos: true,
      rsaKeySize,
      challengeType: 'http-01',
    };

    return this._greenlock.register (options);
  },

  _greenlock: null,

  _approveDomains: null,

  debug: false,

  staging: false
});

/**
 * Factory method for creating the GreenlockProtocol.
 *
 * @param greenlock
 * @return {*}
 * @constructor
 */
function GreenlockProtocol (greenlock) {
  const GP = Protocol.extend ({
    /// Reference to the greenlock service.
    greenlock,

    /// The secure connection server.
    https: null,

    /**
     * Listen on the insecure port. This is needed for the callback response. After
     * we start listening, we can initiate the registration process with Let's Encrpyt.
     */
    listen () {
      return Promise.all ([
        this._super.call (this, ...arguments),
        this.https.listen ({ port: DEFAULT_HTTPS_PORT })
      ]);
    },

    /**
     * Close both the http and http connection.
     *
     * @return {*}
     */
    close () {
      return this._super.call (this, ...arguments).then (() => this.https.close ());
    }
  });

  GP.createProtocol = function (app, options) {
    const redirectHttps = require ('redirect-https')();
    const http = require ('http').createServer (greenlock.middleware (redirectHttps));
    const https = require ('https').createServer (greenlock.tlsOptions, app);

    // We must always listen on port 80 for the http server. This allows Let's Encrypt
    // to communicate with the application.
    options.port = DEFAULT_HTTP_PORT;

    return new GP ({server: http, options, https});
  };

  return GP;
}