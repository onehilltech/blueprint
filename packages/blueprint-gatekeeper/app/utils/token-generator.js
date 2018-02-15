const blueprint = require ('@onehilltech/blueprint')
  , Object      = require ('core-object')
  , jwt         = require ('jsonwebtoken')
  , merge       = require ('lodash.merge')
  , _           = require ('lodash')
  , assert      = require ('assert')
  ;

const DEFAULT_ALGORITHM = 'HS256';

/**
 * @class TokenGenerator
 *
 * Wrapper class for jsonwebtoken to sign and verify access tokens.
 */
module.exports = Object.extend ({
  init () {
    this._super.apply (this, arguments);
    this._doInit (blueprint.app);
  },

  /**
   * Helper method that performs the initialization of the object.
   *
   * @param app
   * @private
   */
  _doInit (app) {
    let tokenConfig = app.configs.gatekeeper.token;

    if (!tokenConfig)
      throw new Error ('gatekeeper.config.js: missing token property');

    let {kind, options} = tokenConfig;

    assert (kind === 'jwt', 'gatekeeper.config.js: token.kind must have value \'jwt\'');
    assert (!!options, 'gatekeeper.config.js: missing token.options property');
    assert (!!options.secret || (!!options.publicKey && !!options.privateKey), 'gatekeeper.config.js: token.options must define secret or publicKey/privateKey');
    assert (!!options.issuer, 'gatekeeper.config.js: token.options must define secret or publicKey/privateKey');

    // Let's cache the options locally. But, we need to separate the hash from
    // the options used to generate the token.

    this._signingHash = options.privateKey || options.secret;
    this._verifyHash = options.publicKey || options.secret;
    this.options = merge ({algorithm: DEFAULT_ALGORITHM}, _.omit (options, ['secret', 'publicKey', 'privateKey']));
  },

  /**
   * Generate a JSON web token for the payload. You can pass in an optional options hash
   * to override the default options.
   *
   * @param payload
   * @param opts
   * @param callback      Optional callback
   */
  generateToken (payload, opts, callback) {
    let options = merge ({}, this.options, opts);
    return jwt.sign (payload, this._signingHash, options, callback);
  },

  /**
   * Verify an existing JSON web token.
   *
   * @param token
   * @param opts
   * @param callback      Optional callback
   */
  verifyToken (token, opts, callback) {
    let options = merge ({}, this.options, opts);

    if (!options.algorithms) {
      if (options.algorithm)
        options.algorithms = [options.algorithm];
      else
        options.algorithms = ['none'];
    }

    return jwt.verify (token, this._verifyHash, options, callback);
  }
});

