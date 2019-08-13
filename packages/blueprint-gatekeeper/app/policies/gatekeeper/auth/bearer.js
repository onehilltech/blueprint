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
  /// The access token model.
  AccessToken: model ('access-token'),

  /// The gatekeeper service with the token generators.
  gatekeeper: service (),

  /// Token generator used to verify the tokens.
  _tokenGenerator: null,

  init () {
    this._super.call (this, ...arguments);

    this._tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:access_token');
  },

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

    let authorization = req.get ('authorization');
    let token;

    if (authorization) {
      let parts = authorization.split (' ');

      if (parts.length !== 2)
        return Promise.reject (new BadRequestError ('invalid_authorization', 'The authorization header is invalid.'));

      if (!BEARER_SCHEME_REGEXP.test (parts[0]))
        return Promise.reject (new BadRequestError ('invalid_scheme', 'The authorization scheme is invalid.'));

      token = parts[1];
    }
    else if (req.body && req.body.access_token) {
      token = req.body.access_token;
    }
    else if (req.query && req.query.access_token) {
      token = req.query.access_token;
    }
    else {
      return Promise.reject (new BadRequestError ('missing_token', 'The access token is missing.'));
    }

    return this._tokenGenerator.verifyToken (token).then (payload => {
      const {jti,scope} = payload;

      // Add the scope to the request, and find the access token.
      req.scope = scope || [];
      return this.AccessToken.findById (jti).populate ('client account').exec ();
    }).then (accessToken => {
      if (!accessToken)
        return {failureCode: 'unknown_token', failureMessage: 'The access token is unknown.'};

      if (!accessToken.enabled)
        return {failureCode: 'token_disabled', failureMessage: 'The access token is disabled.'};

      if (!accessToken.client)
        return {failureCode: 'unknown_client', failureMessage: 'The client is unknown.'};

      if (!accessToken.client.enabled)
        return {failureCode: 'client_disabled', failureMessage: 'The client is disabled.'};

      if (accessToken.client.is_deleted)
        return {failureCode: 'client_deleted', failureMessage: 'The client has been deleted.'};

      if (accessToken.maxUsageLimit ())
        return {failureCode: 'max_usage', failureMessage: 'The access token has reached its max usage.'};

      // Let's make sure the request is originate from the same address that was
      // used to create the request.
      const origin = req.get ('origin');

      if (origin && accessToken.origin && origin !== accessToken.origin)
        return {failureCode: 'invalid_origin', failureMessage: 'The ip address for the request does not match ' +
          'the ip address of the request that created the access token.'};

      // Set the user to the client id.
      req.accessToken = accessToken;
      req.user = accessToken.client;

      if (accessToken.type === 'user_token') {
        if (!accessToken.account)
          return {failureCode: 'unknown_account', failureMessage: 'The account is unknown.'};

        if (!accessToken.account.enabled)
          return {failureCode: 'account_disabled', failureMessage: 'The account is disabled.'};

        if (accessToken.account.is_deleted)
          return {failureCode: 'account_deleted', failureMessage: 'The account has been deleted.'};

        // Update the user to the account id.
        req.user = accessToken.account;
      }

      // Lastly, check the scope of the request is exist. We only authorize requests
      // that have a scope that matches the scope of the policy.
      return this._checkScope (req);
    }).catch (err => {
      // Translate the error, if necessary. We have to check the name because the error
      // could be related to token verification.
      if (err.name === 'TokenExpiredError')
        return { failureCode: 'token_expired', failureMessage: 'The access token has expired.'};

      if (err.name === 'JsonWebTokenError')
        return { failureCode: 'invalid_token', failureMessage: err.message};

      return Promise.reject (err);
    });
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
