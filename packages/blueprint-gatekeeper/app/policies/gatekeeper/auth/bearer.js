'use strict';

const async     = require ('async')
  , blueprint   = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
  , passport    = require ('passport')
  , AccessToken = require ('../../../models/AccessToken')
  , serializer  = require ('../../../middleware/serializers') (blueprint.app.configs.gatekeeper.token)
;

module.exports = Policy.anySeries ([
  /*
   * Either we are already authenticiated.
   */
  function (req, callback) {
    return callback (null, req.isAuthenticated ());
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
            var parts = req.headers.authorization.split (' ');

            if (parts.length == 2) {
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
          serializer.verifyToken (accessToken, {}, function (err, payload) {
            if (!err)
              return callback (null, payload);

            // Process the error message. We have to check the name because the error
            // could be related to token verification.
            if (err.name === 'TokenExpiredError')
              return callback (new HttpError (401, 'token_expired', 'Token has expired'));

            if (err.name === 'JsonWebTokenError')
              return callback (new HttpError (400, 'invalid_token', err.message));
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
      async.waterfall ([
        /**
         * Check the access token, and login the user.
         *
         * @param callback
         * @returns {*}
         */
        function (callback) {
          var accessToken = req.accessToken;

          if (!accessToken)
            return callback (null, false, 'Unknown access token');

          if (!accessToken.enabled)
            return callback (null, false, 'Token is disabled');

          if (!accessToken.client)
            return callback (null, false, 'Client is unknown');

          if (!accessToken.client.enabled)
            return callback (null, false, 'Client is disabled');

          // Set the user to the client id.
          var user = accessToken.client;

          if (accessToken.kind === 'user_token') {
            if (!accessToken.account)
              return callback (null, false, 'Account is unknown');

            if (!accessToken.account.enabled)
              return callback (null, false, 'Account is disabled');

            // Update the user to the account id.
            user = accessToken.account;
          }

          req.login (user, {session: false}, callback);
        },

        /**
         * The policy has passed.
         *
         * @param callback
         * @returns {*}
         */
        function (callback) {
          return callback (null, true);
        }
      ], callback);
    }
  ])
]);
