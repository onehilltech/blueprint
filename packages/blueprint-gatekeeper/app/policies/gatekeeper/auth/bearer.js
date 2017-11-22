'use strict';

const async     = require ('async')
  , blueprint   = require ('@onehilltech/blueprint')
  , HttpError   = blueprint.errors.HttpError
  , Policy      = blueprint.Policy
  , AccessToken = require ('../../../models/AccessToken')
  , AccessTokenGenerator = require ('../../../utils/access-token-generator')
  ;

const tokenGenerator = new AccessTokenGenerator ();

module.exports = Policy.anySeries ([
  /*
   * Either we are already authenticated.
   */
  function (req, callback) {
    return callback (null, !!req.user);
  },

  /*
   * Or, we need to authenticate the user.
   */
  Policy.allSeries ([
    /*
     * Verify and cache the access token.
     */
    function (req, callback) {
      async.waterfall ([
        /*
         * Extract the access token from the request.
         */
        function (callback) {
          if (req.headers && req.headers.authorization) {
            let parts = req.headers.authorization.split (' ');

            if (parts.length === 2) {
              if (/^Bearer$/i.test (parts[0])) {
                return callback (null, parts[1]);
              }
              else {
                return callback (new HttpError (400, 'invalid_scheme', 'Invalid authorization scheme'));
              }
            }
            else {
              return callback (new HttpError (400, 'invalid_authorization', 'Invalid authorization header'));
            }
          }
          else if (req.body && req.body.access_token) {
            return callback (null, req.body.access_token);
          }
          else if (req.query && req.query.access_token) {
            return callback (null, req.query.access_token);
          }
          else {
            return callback (new HttpError (400, 'missing_token', 'Missing access token'));
          }
        },

        /*
         * Verify the access token.
         */
        function (accessToken, callback) {
          tokenGenerator.verifyToken (accessToken, {}, function (err, payload) {
            if (!err)
              return callback (null, payload);

            // Process the error message. We have to check the name because the error
            // could be related to token verification.
            if (err.name === 'TokenExpiredError')
              return callback (new HttpError (401, 'token_expired', 'Token has expired'));

            if (err.name === 'JsonWebTokenError')
              return callback (new HttpError (403, 'invalid_token', err.message));
          });
        },

        /*
         * Locate the access token model in the database.
         */
        function (payload, callback) {
          req.scope = payload.scope;
          AccessToken.findById (payload.jti).populate ('client account').exec (callback);
        },

        /*
         * Cache the access token model.
         */
        function (accessToken, callback) {
          req.accessToken = accessToken;
          return callback (null, true);
        }
      ], callback);
    },

    /*
     * Check the state of the access token model.
     */
    function (req, callback) {
      let accessToken = req.accessToken;

      if (!accessToken)
        return callback (null, false, {reason: 'unknown_token', message: 'Unknown access token'});

      if (!accessToken.enabled)
        return callback (null, false, {reason: 'token_disabled', message: 'Token is disabled'});

      if (!accessToken.client)
        return callback (null, false, {reason: 'unknown_client', message: 'Unknown client'});

      if (!accessToken.client.enabled)
        return callback (null, false, {reason: 'client_disabled', message: 'Client is disabled'});

      // Set the user to the client id.
      req.user = accessToken.client;

      if (accessToken.kind === 'user_token') {
        if (!accessToken.account)
          return callback (null, false, {reason: 'unknown_account', message: 'Unknown account'});

        if (!accessToken.account.enabled)
          return callback (null, false, {reason: 'account_disabled', message: 'Account is disabled'});

        // Update the user to the account id.
        req.user = accessToken.account;
      }

      return callback (null, true);
    }
  ])
]);
