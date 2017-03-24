'use strict';

const async     = require ('async')
  , blueprint   = require ('@onehilltech/blueprint')
  , passport    = require ('passport')
  , AccessToken = require ('../../../models/AccessToken')
  , serializer  = require ('../../../middleware/serializers') (blueprint.app.configs.gatekeeper.token)
  ;

module.exports = function (req, callback) {
  // There is not need to continue if the request already has an access token
  // associated with it.
  if (req.isAuthenticated ())
    return callback (null, true);

  async.waterfall ([
    /*
     * Locate the access token in the request.
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

    function (payload, callback) {
      // Store the scope of authorization.
      req.scope = payload.scope;
      AccessToken.findById (payload.jti).populate ('client account').exec (callback);
    },

    function (accessToken, callback) {
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

      // Store the access token in the request, and login the user.
      req.accessToken = accessToken;
      req.login (user, {session: false}, callback);
    },

    function (callback) {
      return callback (null, true);
    }
  ], callback);
};
