const TokenGenerator = require ('./token-generator');
const merge = require ('lodash.merge');

/**
 * @class AccessTokenGenerator
 *
 * The default class used for generating access tokens.
 */
module.exports = TokenGenerator.extend ({
  init (opts) {
    this._super.apply (this, arguments);
    merge (this.options, {subject: 'gatekeeper.password.reset'}, opts);
  }
});
