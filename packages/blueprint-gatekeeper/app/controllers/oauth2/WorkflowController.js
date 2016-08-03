var winston   = require ('winston')
  , uid       = require ('uid-safe')
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Client      = require ('../../models/Client')
  , Account     = require ('../../models/Account')
  , AccessToken = require ('../../models/oauth2/AccessToken')
  ;

var HttpError = blueprint.errors.HttpError
  ;

/**
 * @class WorkflowController
 *
 * The WorkflowController provides methods for binding OAuth 2.0 routes to its
 * implementation of the OAuth 2.0 protocol.
 *
 * @param models
 * @constructor
 */
function WorkflowController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (WorkflowController);

/**
 * Logout a user. After this method returns, the token is no longer valid.
 */
WorkflowController.prototype.logoutUser = function () {
  return {
    execute: function (req, res, callback) {
      var token = req.authInfo.token;

      token.remove (function (err) {
        if (err) return callback (new HttpError (500, 'Failed to logout user'));
        return res.status (200).send (true);
      });
    }
  };
};

/**
 * Get the access token. The exchange workflow depends on the grant_type
 * body parameter.
 *
 * @param callback
 * @returns {Function}
 */
WorkflowController.prototype.issueToken = function () {
  function grantToken (res, accessToken) {
    return res.status (200).json ({
      token_type    : 'Bearer',
      access_token  : accessToken.token,
      refresh_token : accessToken.refresh_token,
      expires_in    : accessToken.expires_in
    });
  }

  function lookupClient (clientId, clientSecret, callback) {
    Client.findById (clientId, function (err, client) {
      if (err)
        return callback (new HttpError (400, 'Failed to lookup client'));

      if (!client)
        return callback (new HttpError (400, 'Invalid client id'));

      if (!client.enabled)
        return callback (new HttpError (401, 'Client is not enabled'));
      
      if (clientSecret && client.secret !== clientSecret)
        return callback (new HttpError (400, 'Client secret is incorrect'));

      callback (null, client);
    });
  }

  /**
   * Implementation of the client_credentials grant type.
   *
   * @param req
   * @param res
   * @param callback
   */
  function client_credentials (req, res, callback) {
    req.checkBody ('client_id', 'required').notEmpty();
    req.checkBody ('client_secret', 'required').notEmpty();

    var errs = req.validationErrors (true);
    if (errs) return callback (new HttpError (400, errs));

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;

    lookupClient (clientId, clientSecret, function (err, client) {
      if (err) return callback (err);

      // Authenticate the username/password combo. Upon authentication, we
      // are to return the token/refresh_token combo.
      winston.log ('info', 'client %s: exchanging secret for access token', client.id);

      // Create a new user token and refresh token.
      AccessToken.createClientToken (client.id, '*', function (err, accessToken) {
        if (err) return callback (new HttpError (500, 'Failed to generate token'));

        return grantToken (res, accessToken);
      });
    });
  }

  /**
   * Implementation of the password grant type.
   *
   * @param req
   * @param res
   */
  function password (req, res, callback) {
    req.checkBody ('client_id', 'required').notEmpty();
    req.checkBody ('username', 'required').notEmpty();
    req.checkBody ('password', 'required').notEmpty();

    var errs = req.validationErrors (true);
    if (errs) return callback (new HttpError (400, errs));

    var clientId = req.body.client_id;
    var username = req.body.username;
    var password = req.body.password;

    // Locate the client and make sure the client is enabled.
    lookupClient (clientId, null, function (err, client) {
      if (err) return callback (err);

      // Authenticate the username/password combo. Upon authentication, we
      // are to return the token/refresh_token combo.
      winston.log ('info', 'client %s: exchanging username/password for access token [user=%s]', client.id, username);

      Account.findOne ({'username': username}, function (err, account) {
        // Check the result of the operation. If the account does not exist or the
        // account is disabled, then return the appropriate error message.
        if (err)
          return callback (new HttpError (500, 'Failed to retrieve account'));

        if (!account)
          return callback (new HttpError (400, 'Invalid username'));

        if (!account.enabled)
          return callback (new HttpError (401, 'Account is disabled'));

        account.verifyPassword (password, function (err, match) {
          // Check the result of the operation. If there is an error, or the password
          // does not match, then return an error.
          if (err)
            return callback (new HttpError (500, 'Failed to verify password'));

          if (!match)
            return callback (new HttpError (401, 'Invalid password'));

          // Create a new user token and refresh token.
          AccessToken.createUserToken (client.id, account.id, function (err, accessToken) {
            if (err)
              return callback (new HttpError (500, 'Failed to generate access token'));

            return grantToken (res, accessToken);
          });
        });
      });
    });
  }

  /**
   * Implementation of the refresh_token grant type.
   *
   * @param req
   * @param res
   */
  function refresh_token (req, res, callback) {
    req.checkBody ('client_id', 'required').notEmpty ();
    req.checkBody ('refresh_token', 'required').notEmpty ();

    var errs = req.validationErrors (true);
    if (errs) return callback (new HttpError (400, errs));

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;
    var refreshToken = req.body.refresh_token;

    AccessToken
      .findOne ({refresh_token: refreshToken, client: clientId})
      .populate ('account client')
      .exec (function (err, at) {
        if (err)
          return callback (new HttpError (500, 'Failed to locate refresh token'));

        if (!at)
          return callback (new HttpError (400, 'Refresh token is invalid'));

        // Check the client and account. The client and the account must be enabled. The
        // client secret must also match, if provided.
        if (!at.client.enabled)
          return callback (new HttpError (401, 'Client access is disabled'));

        if (clientSecret && at.client.secret !== clientSecret)
          return callback (new HttpError (400, 'Client secret is incorrect'));

        if (!at.account.enabled)
          return callback (new HttpError (400, 'User account is disabled'));

        // Generate a new access and refresh token.
        async.waterfall ([
          function (callback) {
            AccessToken.generateTokenString (callback);
          },

          function (token, callback) {
            AccessToken.generateTokenString (function (err, token) {
              return callback (null, token, refreshToken);
            });
          },

          function (token, refreshToken, callback) {
            at.token = token;
            at.refresh_token = token;

            at.save (callback);
          }
        ], function (err, at) {
          if (err) return callback (new HttpError (500, 'Failed to save new token'));

          grantToken (res, at);
        });
      });
  }

  var grantTypes = {
    password: password,
    client_credentials: client_credentials,
    refresh_token: refresh_token
  };

  return {
    validate: function (req, callback) {
      req.checkBody ('grant_type', 'required').notEmpty ().isIn (Object.keys (grantTypes));
      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      // Locate the handler for the grant type.
      var grantType = req.body.grant_type;
      var grantFunc = grantTypes[grantType];

      // Handle the token request.
      return grantFunc (req, res, callback);
    }
  };
};

exports = module.exports = WorkflowController;
