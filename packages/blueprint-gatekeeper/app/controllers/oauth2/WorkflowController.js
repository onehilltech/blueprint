var winston    = require ('winston')
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , Policy     = blueprint.Policy
  , gatekeeper = require ('../../../lib')

  ;

var Client      = require ('../../models/Client')
  , Account     = require ('../../models/Account')
  , AccessToken = require ('../../models/oauth2/AccessToken')
  ;

var HttpError = blueprint.errors.HttpError
  ;

var gatekeeperConfig;
var tokenStrategy;

messaging.on ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

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
 * @returns
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

  var grantTypes = {
    password: {
      validate: function (req, callback) {
        req.checkBody ('client_id', 'required').isMongoId ();
        req.checkBody ('username', 'required').notEmpty();
        req.checkBody ('password', 'required').notEmpty();
        return callback (req.validationErrors (true));
      },

      execute: function (req, res, callback) {
        var clientId = req.body.client_id;
        var username = req.body.username;
        var password = req.body.password;

        // Locate the client and make sure the client is enabled.
        async.waterfall ([
          function (callback) { lookupClient (clientId, null, callback); },

          function (client, callback) {
            // Authenticate the username/password combo. Upon authentication, we
            // are to return the token/refresh_token combo.
            winston.log ('info', 'client %s: exchanging username/password for access token [user=%s]', client.id, username);

            Account.findOne ({username: username}, function (err, account) {
              // Check the result of the operation. If the account does not exist or the
              // account is disabled, then return the appropriate error message.
              if (err) return callback (new HttpError (500, 'Failed to retrieve account'));
              if (!account) return callback (new HttpError (400, 'Invalid username'));
              if (!account.enabled) return callback (new HttpError (401, 'Account is disabled'));

              account.verifyPassword (password, function (err, match) {
                // Check the result of the operation. If there is an error, or the password
                // does not match, then return an error.
                if (err) return callback (new HttpError (500, 'Failed to verify password'));
                if (!match) return callback (new HttpError (401, 'Invalid password'));
                return callback (err, client, account);
              });
            });
          },

          function (client, account, callback) {
            // Create a new user token and refresh token.
            AccessToken.createUserToken (client.id, account.id, function (err, accessToken) {
              if (err) return callback (new HttpError (500, 'Failed to generate access token'));
              return callback (null, accessToken);
            });
          },

          function (token, callback) {
            grantToken (res, token);
            return callback (null);
          }
        ], callback);
      }
    },

    client_credentials: {
      validate: function (req, callback) {
        req.checkBody ('client_id', 'required').isMongoId ();
        req.checkBody ('client_secret', 'required').notEmpty ();
        return callback (req.validationErrors (true));
      },

      execute: function (req, res, callback) {
        var clientId = req.body.client_id;
        var clientSecret = req.body.client_secret;

        async.waterfall ([
          function (callback) { lookupClient (clientId, clientSecret, callback); },

          function (client, callback) {
            // Authenticate the username/password combo. Upon authentication, we
            // are to return the token/refresh_token combo.
            winston.log ('info', 'client %s: exchanging secret for access token', client.id);

            // Create a new user token and refresh token.
            AccessToken.createClientToken (client.id, '*', function (err, accessToken) {
              if (err) return callback (new HttpError (500, 'Failed to generate token'));
              return callback (null, accessToken);
            });
          },

          function (accessToken, callback) {
            grantToken (res, accessToken);
            return callback (null);
          }
        ], callback);
      }
    },

    refresh_token: {
      validate: function (req, callback) {
        req.checkBody ('client_id', 'required').notEmpty ();
        req.checkBody ('refresh_token', 'required').notEmpty ();
        return callback (req.validationErrors (true));
      },

      execute: function (req, res, callback) {
        var clientId = req.body.client_id;
        var clientSecret = req.body.client_secret;
        var refreshToken = req.body.refresh_token;

        async.waterfall ([
          function (callback) {
            AccessToken
              .findOne ({refresh_token: refreshToken, client: clientId})
              .populate ('account client').exec (function (err, at) {
                if (err) return callback (new HttpError (500, 'Failed to locate refresh token'));
                if (!at) return callback (new HttpError (400, 'Refresh token is invalid'));
                return callback (null, at);
            });
          },

          function (at, callback) {
            // Check the client and account. The client and the account must be enabled. The
            // client secret must also match, if provided.
            if (!at.client.enabled) return callback (new HttpError (401, 'Client access is disabled'));
            if (clientSecret && at.client.secret !== clientSecret) return callback (new HttpError (400, 'Client secret is incorrect'));
            if (!at.account.enabled) return callback (new HttpError (400, 'User account is disabled'));

            // Generate a new access and refresh token.
            async.waterfall ([
              function (callback) { AccessToken.generateTokenString (callback); },
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

              return callback (null);
            });
          }
        ], callback);
      }
    }
  };

  return {
    validate: function (req, callback) {
      req.checkBody ('grant_type', 'required').notEmpty ().isIn (Object.keys (grantTypes));

      if (req.body.grant_type)
        return grantTypes[req.body.grant_type].validate (req, callback);

      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      grantTypes[req.body.grant_type].execute (req, res, callback);
    }
  };
};

exports = module.exports = WorkflowController;
