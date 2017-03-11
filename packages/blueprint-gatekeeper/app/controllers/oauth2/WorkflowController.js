var winston    = require ('winston')
  , async      = require ('async')
  , blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
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

messaging.on ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  accessConfig = gatekeeperConfig.access || {};

  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

/**
 * Verify a client's ability to create a token.
 *
 * @param clientId
 * @param clientSecret
 * @param callback
 */
function verifyClient (clientId, clientSecret, callback) {
  Client.findById (clientId, function (err, client) {
    if (err) return callback (new HttpError (400, 'internal_error', 'Failed to lookup client'));
    if (!client) return callback (new HttpError (400, 'invalid_client', 'Client not found'));
    if (!client.enabled) return callback (new HttpError (403, 'client_disabled', 'Client is disabled'));
    if (clientSecret && client.secret !== clientSecret) return callback (new HttpError (400, 'invalid_secret', 'Incorrect client secret'));

    callback (null, client);
  });
}

/**
 * Send the token in the response.
 *
 * @param res
 * @param tokens
 * @param callback
 */
function sendToken (res, tokens, callback) {
  var ret = { token_type: 'Bearer', access_token: tokens.access_token };

  if (tokens.refresh_token)
    ret.refresh_token = tokens.refresh_token;

  res.status (200).json (ret);

  callback (null);
}

/**
 * Create a save the user access token. The user access token has an accessToken
 * and a refreshToken.
 *
 * @param client
 * @param account
 * @param scope
 * @param callback
 */
function createAndSaveUserAccessToken (opts, callback) {
  async.waterfall ([
    // Create a new AccessToken model. The model is used to determine
    function (callback) {
      var doc = {
        client: opts.client.id,
        account: opts.account.id,
        refresh_token: new mongodb.Types.ObjectId ()
      };

      AccessToken.create (doc, callback);
    },

    function (accessToken, callback) {
      // Use the information in the accessToken to generate a jwt for both the accessToken
      // and the refreshToken.

      async.series ({
        access_token: function (callback) {
          // Build the scope for the access token. It will be the scope of the client,
          // plus the scope of the account, plus the on-demand scope.
          var scope = [];

          if (opts.account.scope)
            scope = scope.concat (opts.account.scope);

          if (opts.client.scope)
            scope = scope.concat (opts.client.scope);

          if (opts.scope)
            scope = scope.concat (opts.scope);

          var expiresIn = accessConfig.expiresIn || DEFAULT_ACCESS_EXPIRES_IN;

          var jwt = {
            payload: { kind: KIND_USER_TOKEN, scope: scope },
            options: { jwtid: accessToken.id, expiresIn: expiresIn }
          };

          tokenStrategy.generateToken (jwt, callback);
        },

        refresh_token: function (callback) {
          var jti = accessToken.refresh_token.toString ();

          var jwt = {
            payload: { kind: KIND_REFRESH_TOKEN },
            options: { jwtid: jti }
          };

          tokenStrategy.generateToken (jwt, callback);
        }
      }, callback);
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
 * Issue an access token. The issue workflow depends on the grant_type
 * body parameter.
 *
 * @param callback
 * @returns
 */
WorkflowController.prototype.issueToken = function () {
  var self = this;

  function novalidate (req, callback) { return callback (null); }

  const grantTypes = {
    password: {
      validate: self.checkSchemaThen ({
        username: {in: 'body', notEmpty: true},
        password: {in: 'body', notEmpty: true}
      }, novalidate),

      execute: function (req, res, callback) {
        var clientId = req.body.client_id;
        var username = req.body.username;
        var password = req.body.password;

        // Locate the client and make sure the client is enabled.
        async.waterfall ([
          /**
           * Locate the client sending the request. We need to make sure the client
           * is valid, and is able to access the system.
           *
           * @param callback
           */
          function (callback) {
            verifyClient (clientId, null, callback);
          },

          function (client, callback) {
            async.waterfall ([
              /**
               * Locate the account for the username.
               *
               * @param callback
               */
              function (callback) {
                // Authenticate the username/password combo. Upon authentication, we
                // are to return the token/refresh_token combo.
                Account.findOne ({username: username}, function (err, account) {
                  // Check the result of the operation. If the account does not exist or the
                  // account is disabled, then return the appropriate error message.
                  if (err) return callback (new HttpError (500, 'internal_error', 'Failed to retrieve account'));
                  if (!account) return callback (new HttpError (400, 'invalid_username', 'Invalid username'));
                  if (!account.enabled) return callback (new HttpError (403, 'account_disabled', 'Account is disabled'));

                  return callback (null, account);
                });
              },

              /**
               * Verify the provided password with what we have on file.
               *
               * @param account
               * @param callback
               */
              function (account, callback) {
                account.verifyPassword (password, function (err, match) {
                  // Check the result of the operation. If there is an error, or the password
                  // does not match, then return an error.
                  if (err) return callback (new HttpError (500, 'internal_error', 'Failed to verify password'));
                  if (!match) return callback (new HttpError (400, 'invalid_password', 'Incorrect password'));
                  return callback (err, account);
                });
              },

              /**
               * Create the user access token, and save it to the database.
               *
               * @param account
               * @param callback
               * @returns {*}
               */
              function (account, callback) {
                return createAndSaveUserAccessToken ({client: client, account: account}, callback);
              }
            ], callback);
          },

          /**
           * Issue the token back to the client.
           *
           * @param tokens          Hash containing the access and refresh tokens
           * @param callback        Callback function
           * @returns {*}
           */
          function (tokens, callback) {
            return sendToken (res, tokens, callback);
          }
        ], callback);
      }
    },

    client_credentials: {
      /**
       * Validate the client credentials request.
       *
       * @param req
       * @param callback
       * @returns {*}
       */
      validate: self.checkSchemaThen ({
        client_secret: {in: 'body', optional: true, notEmpty: true}
      }, novalidate),

      /**
       * Issue a token that has client-level access.
       *
       * @param req
       * @param res
       * @param callback
       */
      execute: function (req, res, callback) {
        var clientId = req.body.client_id;
        var clientSecret = req.body.client_secret;

        async.waterfall ([
          /**
           * Lookup the client to ensure they can be granted a token.
           *
           * @param callback
           */
          function (callback) {
            verifyClient (clientId, clientSecret, callback);
          },

          /**
           * Issue the token for the client
           *
           * @param client
           * @param callback
           */
          function (client, callback) {
            var doc = {client: client.id};

            async.waterfall ([
              /**
               * Save the access token to the database.
               *
               * @param callback
               */
              function (callback) {
                var accessToken = new AccessToken (doc);
                accessToken.save (callback);
              },

              /**
               * Generate a JSON Web Token for the access token.
               *
               * @param accessToken
               * @param n
               * @param callback
               */
              function (accessToken, n, callback) {
                // Authenticate the username/password combo. Upon authentication, we
                // are to return the token/refresh_token combo.
                var expiresIn = accessConfig.expiresIn || DEFAULT_ACCESS_EXPIRES_IN;

                var opts = {
                  payload: { kind: KIND_CLIENT_TOKEN, scope: client.scope },
                  options: { jwtid: accessToken.id, expiresIn: expiresIn }
                };

                tokenStrategy.generateToken (opts, callback);
              }
            ], callback);
          },

          /**
           * Issue the token to the client.
           *
           * @param token
           * @param callback
           */
          function (token, callback) {
            sendToken (res, {access_token: token}, callback);
          }
        ], callback);
      }
    },

    refresh_token: {
      /**
       * Validate the input parameters for refreshing a token.
       *
       * @param req           Request object
       * @param callback      Callback function
       * @returns {*}
       */
      validate: self.checkSchemaThen ({
        refresh_token: {in: 'body', notEmpty: true}
      }, novalidate),

      /**
       * Execute the generation of a new token based on the refresh token.
       *
       * @param req
       * @param res
       * @param callback
       */
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
              return callback (new HttpError (400, 'Invalid refresh token'));

            var refresh_token = payload.jti;
            var filter = {refresh_token: refresh_token, client: clientId};
            var fields = 'account client';

            AccessToken.findOne (filter).populate (fields).exec (function (err, at) {
              if (err) return callback (new HttpError (500, 'Failed to refresh token'));
              if (!at) return callback (new HttpError (400, 'Unknown refresh token'));

              if (!at.client.enabled)
                return callback (new HttpError (403, 'Client is disabled'));

              if (clientSecret && at.client.secret !== clientSecret)
                return callback (new HttpError (400, 'Incorrect client secret'));

              // Check the state of the account.
              if (at.account && !at.account.enabled)
                return callback (new HttpError (400, 'Account is disabled'));

              return callback (null, at);
            });
          },

          function (at, callback) {
            createAndSaveUserAccessToken ({client: at.client, account: at.account}, callback);
          },

          function (token, callback) {
            sendToken (res, token, callback);
          }
        ], callback);
      }
    }
  };

  const GRANT_TYPES = Object.keys (grantTypes);

  function validate (req, callback) {
    var val = grantTypes[req.body.grant_type].validate || __gatekeeper_validate;
    val (req, callback);
  }

  return {
    /**
     * Validate the request object. We only accept 3 types of grant requests. We also
     * need to let the grant_type validate the request.
     *
     * @param req
     * @param callback
     */
    validate: this.checkSchemaThen ({
      grant_type: {in: 'body', notEmpty: true, isIn: {options: [GRANT_TYPES]}},
      client_id: {in: 'body', notEmpty: true, isMongoId: true}
    }, validate),

    /**
     * Sanitize the request data.
     *
     * @param req
     * @param callback
     */
    sanitize: function (req, callback) {
      req.body.client_id = new mongodb.Types.ObjectId (req.body.client_id);

      var sanitize = grantTypes[req.body.grant_type].sanitize || __gatekeeper_sanitize;
      sanitize (req, callback);
    },

    /**
     * Execute the next step in the workflow based on the grant_type.
     *
     * @param req
     * @param res
     * @param callback
     */
    execute: function (req, res, callback) {
      grantTypes[req.body.grant_type].execute (req, res, callback);
    }
  };

  function __gatekeeper_validate (req, callback) { return callback (req.validationErrors ()); }
  function __gatekeeper_sanitize (req, callback) { return callback (null); }
};

exports = module.exports = WorkflowController;
