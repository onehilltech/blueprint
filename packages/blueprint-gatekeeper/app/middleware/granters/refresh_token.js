'use strict';

const async     = require ('async')
  , blueprint   = require ('@onehilltech/blueprint')
  , mongodb     = require ('@onehilltech/blueprint-mongodb')
  , ObjectId    = mongodb.Types.ObjectId
  , HttpError   = blueprint.errors.HttpError
  , Account     = require ('../../models/Account')
  , UserToken   = require ('../../models/UserToken')
  , AccessToken = require ('../../models/AccessToken')
  ;

var exports = module.exports = {};
var serializer = require ('../../middleware/serializers') (blueprint.app.configs.gatekeeper.token)
var password = require ('./password');

/**
 * Policies for granting an access token based on password.
 *
 * @param req
 * @param callback
 */
exports.policies = function (req, callback) {
  var clientSecret = req.body.client_secret;
  var refreshToken = req.body.refresh_token;

  async.waterfall ([
    function (callback) {
      serializer.verifyToken (refreshToken, {}, function (err, payload) {
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

    function (payload, callback) {
      var filter = {refresh_token: new ObjectId (payload.jti), client: req.client._id};
      AccessToken.findOne (filter).populate ('client account').exec (callback);
    },

    function (accessToken, callback) {
      if (!accessToken)
        return callback (new HttpError (400, 'invalid_token', 'Unknown refresh token'));

      if (!accessToken.client.enabled)
        return callback (new HttpError (403, 'client_disabled', 'Client is disabled'));

      if (clientSecret && accessToken.client.secret !== clientSecret)
        return callback (new HttpError (400, 'incorrect_secret', 'Incorrect client secret'));

      // Check the state of the account.
      if (!accessToken.account.enabled)
        return callback (new HttpError (400, 'account_disabled', 'Account is disabled'));

      req.accessToken = accessToken;

      return callback (null, true);
    }
  ], callback);
};

/**
 * Create an access token.
 *
 * @param req
 * @param callback
 */
exports.createToken = function (req, callback) {
  var doc = {
    client: req.accessToken.client._id,
    account: req.accessToken.account._id,
    scope: req.accessToken.scope,
    refresh_token: new ObjectId ()
  };

  UserToken.create (doc, callback);
};
