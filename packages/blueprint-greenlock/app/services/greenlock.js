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

const { fromCallback } = require ('bluebird');
const { merge } = require ('lodash');

const path = require ('path');
const assert = require ('assert');

const Greenlock = require ('greenlock');
//const SniChallenge = require ('le-challenge-sni');

const DEFAULT_VERSION = 'draft-12';
const SERVER_PRODUCTION = 'https://acme-v02.api.letsencrypt.org/directory';
const SERVER_STAGING = 'https://acme-staging-v02.api.letsencrypt.org/directory';

const DEFAULT_RSA_KEY_SIZE = 2048;

module.exports = Service.extend ({
  debug: false,

  agreeTos: undefined,

  staging: false,

  init () {
    this._super.call (this, ...arguments);

    const config = this.app.lookup ('config:greenlock');
    assert (!!config, 'The application must define a greenlock configuration.');

    if (config) {
      if (config.debug)
        this.debug = config.debug;

      if (config.agreeTos)
        this.agreeTos = config.agreeTos;
    }

    this._config = config;

    // Create our instance of the greenlock agent. After creating the greenlock agent,
    // we can register the custom protocols with the server.
    this._createGreenlock (config);
    this.app.server.registerProtocol ('greenlock', GreenlockProtocol (this));
  },

  agreeToTerms (args, agreeCb) {
    console.log ('agree to terms...');
  },

  approveDomains (opts, certs, cb) {
    console.log ('approveDomains');
  },

  _greenlock: null,

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
      //configDir: this.configDir,
      store,
      //email: config.email,
      agreeToTerms: this.agreeToTerms.bind (this),
      //rsaKeySize: config.rsaKeySize || 2048,
      challengeType: config.challengeType || 'http-01',
      //communityMember: config.communityMember || true,
      //securityUpdates: config.securityUpdates || true,
      //approveDomains: this.approveDomains.bind (this),
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
  }
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
    greenlock,

    https: null,

    /**
     * Listen on the insecure port. This is needed for the callback response. After
     * we start listening, we can initiate the registration process with Let's Encrpyt.
     */
    listen () {
      return this._super.call (this, ...arguments)
        .then (() => this.greenlock.check ())
        .then (certs => certs ? this.listenHttps (certs) : this.greenlock.register ().then (certs => this.listenHttps (certs)))
    },

    /**
     * Close both the http and http connection.
     *
     * @return {*}
     */
    close () {
      return this._super.call (this, ...arguments).then (() => this.https.close ());
    },

    /**
     * Listen for connection on the https.
     *
     * @param certs
     * @return {*}
     */
    listenHttps ({privkey:key, cert, chain}) {
      debug ('creating https connection and listening');

      const tlsOptions = {
        key,
        cert: cert + '\r\n' + chain
      };

      const server = require ('https').createServer (tlsOptions, this.app);
      const options = { port: 443 };

      this.https = Protocol.create ({server, options});

      return this.https.listen ();
    }
  });

  GP.createProtocol = function (app, opts) {
    const redirectHttps = require ('redirect-https')();
    const http = require ('http').createServer (greenlock.middleware (redirectHttps));

    // We must always listen on port 80. Otherwise, the Let's Encrypt servers will
    // not be able to communicate with the application.
    opts.port = 80;

    return new GP ({server: http, options: opts, app});
  };

  return GP;
}