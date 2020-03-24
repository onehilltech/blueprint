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

const assert = require ('assert');
const jwt = require ('jsonwebtoken');

const { BO } = require ('@onehilltech/blueprint');
const { merge, omit } = require ('lodash');
const { fromCallback } = require ('bluebird');

const DEFAULT_ALGORITHM = 'HS256';

/**
 * @class TokenGenerator
 *
 * Wrapper class for jsonwebtoken to sign and verify access tokens.
 */
const TokenGenerator = BO.extend ({
  mergedProperties: ['options'],

  options: {
    algorithm: DEFAULT_ALGORITHM
  },

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.options.secret || (!!this.options.publicKey && !!this.options.privateKey), 'You must define options.secret or options.{publicKey, privateKey}');

    // Let's cache the options locally. But, we need to separate the hash from
    // the options used to generate the token.

    this._signingHash = this.options.privateKey || this.options.secret;
    this._verifyHash = this.options.publicKey || this.options.secret;

    // Remove the custom options that are not supported by jwt.
    this._options = omit (this.options, ['secret','publicKey','privateKey']);
  },

  /**
   * Create a new token generator using this generator as the foundation for
   * the new generator.
   *
   * @param opts    Options
   * @return        {TokenGenerator}
   */
  extend (opts = {}) {
    let options = merge ({}, this.options, opts.options);
    return new TokenGenerator ({options});
  },

  /**
   * Generate a JSON web token for the payload. You can pass in an optional options hash
   * to override the default options.
   *
   * @param payload
   * @param opts
   */
  generateToken (payload = {}, opts = {}) {
    let options = merge ({}, this._options, opts);

    // We prioritize the payload expiration over the options expiration. This means we
    // delete the expiresIn attribute in options.
    if (!!payload.exp && !!options.expiresIn) {
      delete options.expiresIn;
    }

    return fromCallback (callback => {
      jwt.sign (payload, this._signingHash, options, callback);
    });
  },

  generateTokenSync (payload = {}, opts = {}) {
    let options = merge ({}, this._options, opts);

    // We prioritize the payload expiration over the options expiration. This means we
    // delete the expiresIn attribute in options.
    if (!!payload.exp && !!options.expiresIn) {
      delete options.expiresIn;
    }

    return jwt.sign (payload, this._signingHash, options);
  },

  /**
   * Verify an existing JSON web token.
   *
   * @param token
   * @param opts
   */
  verifyToken (token, opts = {}) {
    let options = merge ({}, this.options, opts);

    if (!options.algorithms) {
      if (options.algorithm) {
        options.algorithms = [options.algorithm];
        delete options.algorithm;
      }

      else
        options.algorithms = ['none'];
    }

    return fromCallback (callback => {
      jwt.verify (token, this._verifyHash, options, callback);
    });
  },

  verifyTokenSync (token, opts = {}) {
    let options = merge ({}, this.options, opts);

    if (!options.algorithms) {
      if (options.algorithm) {
        options.algorithms = [options.algorithm];
        delete options.algorithm;
      }

      else
        options.algorithms = ['none'];
    }

    return jwt.verify (token, this._verifyHash, options);
  }
});

module.exports = TokenGenerator;
