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
  Policy,
  ForbiddenError,
  BadRequestError,
  service,
} = require ('@onehilltech/blueprint');

const { some } = require ('micromatch');
const { flattenDeep, isString } = require ('lodash');

const BEARER_SCHEME_REGEXP = /^Bearer$/i;

/**
 * @class BearerPolicy
 *
 * The policy for evaluating the OAuth 2.0 bearer strategy.
 */
module.exports = Policy.extend ({
  /// The issuer for the service.
  issuer: service (),

  /// The options for the bearer.
  options: null,

  init () {
    this._super.call (this, ...arguments);
    this.options = {}
  },

  /**
   * Set the parameters of the policy.
   */
  setParameters () {
    if (arguments.length > 1 || isString (arguments[0])) {
      // This branch is for backwards compatibility. In older versions, the
      // parameters were the supported scopes.

      this.options = {
        scope: flattenDeep (...arguments)
      }
    }
    else {
      this.options = arguments[0];
    }
  },

  async runCheck (req) {
    // The fast path is the check if the request already is already authorized. If
    // it is authorized, then we can just allow the request to pass. Otherwise, we
    // need to check the authorization header.

    if (!!req.accessToken)
      return this._checkOptions (req);

    // Let's make sure the request is originate from the same address that was
    // used to create the request.
    const origin = req.get ('origin');
    const token = this._accessTokenForRequest (req);

    try {
      const options = Object.assign ({ origin }, this.options);
      const accessToken = await this.issuer.verifyToken (token, options);

      // Update the request with the access token, and parts of the access token.
      req.scope = accessToken.scope || [];
      req.accessToken = accessToken;
      req.user = accessToken.account || accessToken.client;

      // Lastly, check the scope of the request.
      return this._checkScope (req);
    }
    catch (reason) {
      throw new ForbiddenError (reason.code, reason.message);
    }
  },

  /**
   * Check the required options against the request.
   *
   * @param req
   * @private
   */
  _checkOptions (req) {
    // First, let's check the scope on the request.
    this._checkScope (req);

    // Delegate the checking to the model.
    const { accessToken } = req;
    return accessToken.check (this.options);
  },

  /**
   * Get the access token from the request.
   *
   * @param req
   * @private
   */
  _accessTokenForRequest (req) {
    const authorization = req.get ('authorization');

    if (authorization) {
      const parts = authorization.split (' ');

      if (parts.length !== 2)
        throw new BadRequestError ('invalid_authorization', 'The authorization header is invalid.');

      if (!BEARER_SCHEME_REGEXP.test (parts[0]))
        throw new BadRequestError ('invalid_scheme', 'The authorization scheme is invalid.');

      return parts[1];
    }
    else if (req.body && req.body.access_token) {
      return req.body.access_token;
    }
    else if (req.query && req.query.access_token) {
      return req.query.access_token;
    }
    else {
      throw new BadRequestError ('missing_token', 'The access token is missing.');
    }
  },

  /**
   * Check the scope of the request against the scope of this policy.
   *
   * @param req
   * @returns {*}
   * @private
   */
  _checkScope (req) {
    if (!this.options.scope || this.options.scope.length === 0)
      return true;

    const { scope } = req;

    if (scope.length === 0)
      throw new ForbiddenError ('missing_scope', 'This request does not have any scope.');

    if (some (this.options.scope, scope))
      throw new ForbiddenError ('invalid_scope', 'This request does not have a valid scope.');

    return true;
  }
});
