var express     = require ('express')
  , winston     = require ('winston')
  , passport    = require ('passport')
  , oauth2orize = require ('oauth2orize')
  ;

var Client           = require ('../../../models/oauth2/client')
  , AccessToken      = require ('../../../models/oauth2/accessToken')
  , Account          = require ('../../../models/account')
  , bearer           = require ('../../../authentication/bearer')
  , Oauth2Controller = require ('../../../controllers/oauth2Controller')
  ;

const TOKEN_LENGTH = 128;

// The Bearer strategy is need for logout.
passport.use (bearer ());

/**
 * Helper function that initializes the exchanges on the server.
 *
 * @param server
 */
function initializeExchanges (server) {
  winston.info ('initializing exchange: password');
  server.exchange ('password', oauth2orize.exchange.password (function (client, username, password, scope, done) {
    winston.log ('info', 'client %s: exchanging username/password for access token [user=%s]', client.id, username);

    Account.authenticate (username, password, function (err, account) {
      if (err)
        return done (new oauth2orize.TokenError (err.message, 'invalid_client'));

      winston.log('info', 'client %s generating access/refresh token for %s', client.id, username);
      AccessToken.newUserToken (TOKEN_LENGTH, client.id, account.id, done);
    });
  }));

  // Configure the client_credentials exchange.
  winston.info ('initializing exchange: client_credentials');
  server.exchange ('client_credentials', oauth2orize.exchange.clientCredentials (function (client, scope, body, done) {
    // We do not care about the client parameter. This is because the body
    // has the credentials we need to find and validate the client.
    if (!body.client_id)
      return done (new oauth2orize.AuthorizationError ('body is missing client_id', 'invalid_request'));

    if (!body.client_secret)
      return done (new oauth2orize.AuthorizationError ('body is missing client_secret', 'invalid_request'));

    var clientId = body.client_id;

    // Locate the client in the body of the message.
    winston.log ('info', 'client %s: exchanging client credentials for access token', clientId);
    Client.findById (clientId, function (err, client) {
      if (err)
        return done (err);

      if (!client)
        return done (new oauth2orize.AuthorizationError ('client id is invalid', 'invalid_request'));

      // Validate the client credentials.
      if (client.secret !== body.client_secret)
        return done (new oauth2orize.AuthorizationError ('client secret does not match', 'access_denied'));

      // Create a new access token for the client. If one already exists, then overwrite
      // the old access token with a new access token.
      winston.info ('client %s: creating access token for client', clientId);
      AccessToken.newClientToken (TOKEN_LENGTH, client, scope, function (err, accessToken) {
        if (err)
          return done (err);

        return done (null, accessToken.token);
      });
    });
  }));

  winston.info ('initializing exchange: refresh_token');
  server.exchange ('refresh_token', oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
    // Locate the original access token that corresponds to this refresh
    // token. If we cannot find the original access token, then we need to
    // return an error to the user.
    winston.log ('info', 'client %s: refreshing access token', client.id);
    AccessToken.refresh (TOKEN_LENGTH, client.id, refresh_token, function (err, accessToken, refreshToken) {
      if (err)
        return done (new oauth2orize.TokenError ('Failed to refresh token', 'invalid_request'));

      return done (err, accessToken, refreshToken);
    });
  }));
}

/**
 * @class OAuth2Router
 *
 * The OAuth 2.0 router for the framework. The router can be initialized to support
 * different granting types. The current types supported are:
 *
 * = code
 * = password
 * = refresh_token
 *
 * If a grant type is not supported, then the corresponding routes will not be
 * available on the router.
 */
function OAuth2Router (opts) {
  this._opts = opts || {};
  this._server = oauth2orize.createServer ();

  // Define the client serialization and deserialization methods. This will only
  // be used for grant types that require a session.
  this._server.serializeClient (function (client, done) {
    return done (null, client.id);
  });

  this._server.deserializeClient (function (id, done) {
    Client.findById (id, done);
  });

  // Initialize the supported exchanges.
  initializeExchanges (this._server);
}

/**
 * Create the Router object for this strategy.
 *
 * @returns {Router}
 */
OAuth2Router.prototype.makeRouter = function () {
  winston.info ('making OAuth 2.0 router');

  var router = express.Router ();
  var oauth2Controller = new Oauth2Controller (this._opts);

  // Define the logout route for Oauth2.
  router.get ('/oauth2/logout',
    [
      passport.authenticate ('bearer', {session : false}),
      oauth2Controller.logoutUser ()
    ]);


  // Define the token route, which is the most important route for this router since
  // it allows clients to request access tokens for the service.
  router.post ('/oauth2/token',
    [
      this._server.token (),
      this._server.errorHandler ()
    ]
  );

  return router;
};

module.exports = exports = OAuth2Router;



