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
  model,
  service,
} = require ('@onehilltech/blueprint');

const { some } = require ('micromatch');
const { flattenDeep } = require ('lodash');

const BEARER_SCHEME_REGEXP = /^Bearer$/i;

/**
 * @class BearerPolicy
 *
 * The policy for evaluating the OAuth 2.0 bearer strategy.
 */
module.exports = Policy.extend ({
  /// The issuer for the service.
  issuer: service (),

  /**
   * Set the parameters of the policy.
   *
   * @param scope
   */
  setParameters (...scope) {
    this.scope = flattenDeep (...scope);
  },

  runCheck (req) {
    // The fast path is the check if the request already is already authorized. If
    // it is authorized, then we can just allow the request to pass. Otherwise, we
    // need to check the authorization header.

    if (!!req.user)
      return this._checkScope (req);

    // Let's make sure the request is originate from the same address that was
    // used to create the request.
    const origin = req.get ('origin');

    return this._getTokenFromRequest (req)
      .then (token => this.issuer.verifyToken (token, { origin })
        .catch (reason => Promise.reject (new ForbiddenError (reason.code, reason.message))))
      .then (accessToken => {
        // Update the request with the access token, and parts of the access token.
        req.scope = accessToken.scope || [];
        req.accessToken = accessToken;
        req.user = accessToken.account || accessToken.client;

        // Lastly, check the scope of the request.
        return this._checkScope (req);
      });
  },

  /**
   * Get the access token from the request.
   *
   * @param req
   * @private
   */
  _getTokenFromRequest (req) {
    let authorization = req.get ('authorization');

    if (authorization) {
      let parts = authorization.split (' ');

      if (parts.length !== 2)
        return Promise.reject (new BadRequestError ('invalid_authorization', 'The authorization header is invalid.'));

      if (!BEARER_SCHEME_REGEXP.test (parts[0]))
        return Promise.reject (new BadRequestError ('invalid_scheme', 'The authorization scheme is invalid.'));

      return Promise.resolve (parts[1]);
    }
    else if (req.body && req.body.access_token) {
      return Promise.resolve (req.body.access_token);
    }
    else if (req.query && req.query.access_token) {
      return Promise.resolve (req.query.access_token);
    }
    else {
      return Promise.reject (new BadRequestError ('missing_token', 'The access token is missing.'));
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
    if (!this.scope || this.scope.length === 0)
      return true;

    let {scope} = req;

    if (scope.length === 0)
      return {failureCode: 'missing_scope', failureMessage: 'This request does not have any scope.'};

    return some (this.scope, scope) ? true : {failureCode: 'invalid_scope', failureMessage: 'This request does not have a valid scope.'};
  }
});
