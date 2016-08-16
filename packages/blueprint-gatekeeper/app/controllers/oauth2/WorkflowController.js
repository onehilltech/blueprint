var winston    = require ('winston')
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , blueprint  = require ('@onehilltech/blueprint')
  , mongoose   = require ('mongoose')
  , messaging  = blueprint.messaging
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
var accessConfig;

const DEFAULT_ACCESS_EXPIRES_IN = 3600;
const DEFAULT_REFRESH_EXPIRES_IN = 5400;

const KIND_USER_TOKEN = 'user';
const KIND_CLIENT_TOKEN = 'client';
const KIND_REFRESH_TOKEN = 'refresh';

messaging.once ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  accessConfig = gatekeeperConfig.access || {};

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

function grantToken (res, accessToken, refreshToken, callback) {
  var response = { token_type: 'Bearer', access_token: accessToken };

  if (refreshToken)
    response.refresh_token = refreshToken;

  res.status (200).json (response);

  callback (null);
}

function createAndSaveUserAccessToken (client, account, callback) {
  async.waterfall ([
    // Create a new AccessToken model. The model is used to determine
    function (callback) {
      var doc = { client: client._id, account: account._id, refresh_token: new mongoose.Types.ObjectId () };
      var accessToken = new AccessToken (doc);

      accessToken.save (callback);
    },

    function (accessToken, affected, callback) {
      async.series ([
        // Generate the access token.
        function (callback) {
          var expiresIn = accessConfig.expiresIn || DEFAULT_ACCESS_EXPIRES_IN;
          var opts = {
            payload: { kind: KIND_USER_TOKEN, roles: account.roles },
            options: { jwtid: accessToken.id, expiresIn: expiresIn }
          };

          tokenStrategy.generateToken (opts, callback);
        },

        // Generate the refresh token.
        function (callback) {
          var jti = accessToken.refresh_token.toString ();

          var opts = {
            payload: { kind: KIND_REFRESH_TOKEN },
            options: { jwtid: jti }
          };

          tokenStrategy.generateToken (opts, callback);
        }
      ], callback);
    }
  ], callback);
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
            Account.findOne ({username: username}, function (err, account) {
              // Check the result of the operation. If the account does not exist or the
              // account is disabled, then return the appropriate error message.
              if (err) return callback (new HttpError (500, 'Failed to retrieve account'));
              if (!account) return callback (new HttpError (400, 'Invalid username'));
              if (!account.enabled) return callback (new HttpError (401, 'Account is disabled'));

              return callback (null, client, account);
            })
          },

          function (client, account, callback) {
            account.verifyPassword (password, function (err, match) {
              // Check the result of the operation. If there is an error, or the password
              // does not match, then return an error.
              if (err) return callback (new HttpError (500, 'Failed to verify password'));
              if (!match) return callback (new HttpError (401, 'Invalid password'));
              return callback (err, client, account);
            });
          },

          function (client, account, callback) {
            return createAndSaveUserAccessToken (client, account, callback);
          },

          function (result, callback) {
            return grantToken (res, result[0], result[1], callback);
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
            var doc = {client: client._id};
            var accessToken = new AccessToken (doc);

            accessToken.save (function (err, accessToken) {
              return callback (err, client, accessToken);
            });
          },

          function (client, accessToken, callback) {
            // Authenticate the username/password combo. Upon authentication, we
            // are to return the token/refresh_token combo.
            var expiresIn = accessConfig.expiresIn || DEFAULT_ACCESS_EXPIRES_IN;

            var opts = {
              payload: { kind: KIND_CLIENT_TOKEN, roles: client.roles },
              options: { jwtid: accessToken.id, expiresIn: expiresIn }
            };

            tokenStrategy.generateToken (opts, callback);
          },

          function (token, callback) {
            grantToken (res, token, null, callback);
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
          // Verify the token is valid.
          function (callback) {
            tokenStrategy.verifyToken (refreshToken, {}, callback);
          },

          // Decode the token because we need the header.
          function (payload, callback) {
            if (payload.kind !== KIND_REFRESH_TOKEN)
              return callback (new HttpError ('Token is not a refresh token'));

            var refresh_token = payload.jti;
            var filter = {refresh_token: refresh_token, client: clientId};
            var fields = 'account client';

            AccessToken.findOne (filter).populate (fields).exec (function (err, at) {
              if (err) return callback (new HttpError (500, 'Failed to refresh token'));
              if (!at) return callback (new HttpError (400, 'Invalid/unknown refresh token'));

              if (!at.client.enabled)
                return callback (new HttpError (401, 'Client access is disabled'));

              if (clientSecret && at.client.secret !== clientSecret)
                return callback (new HttpError (400, 'Client secret is incorrect'));

              // Check the state of the account.
              if (at.account && !at.account.enabled)
                return callback (new HttpError (400, 'User account is disabled'));

              return callback (null, at);
            });
          },

          function (at, callback) {
            createAndSaveUserAccessToken (at.client, at.account, callback);
          },

          function (result, callback) {
            grantToken (res, result[0], result[1], callback);
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
