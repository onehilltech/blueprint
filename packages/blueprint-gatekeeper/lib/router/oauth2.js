var passport    = require ('passport')
  , local       = require ('passport-local')
  , express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  ;

var AccessToken = require ('../models/oauth2/access-token')
  , Account     = require ('../models/account')
  , Client      = require ('../models/oauth2/client')
  , oauth2      = require ('../models/oauth2')
  , utils       = require ('../utils')
  ;

const ACCESS_TOKEN_LENGTH = 256;
const CODE_TOKEN_LENGTH = 16;

// Use the client authentication strategy.
passport.use (require ('../authentication/client') ());
passport.use (require ('../authentication/client-password') ());
passport.use (require ('../authentication/local') ());

/**
 * @class Oauth20Router
 *
 * The OAuth 2.0 strategy for the framework.
 */
function Oauth20Router (opts) {


  this._opts = opts || {};
  this._clientProperty = this._opts.clientProperty || 'client';
  this._userProperty = this._opts.userProperty || 'user';

  if (this._opts.session === undefined)
    throw new Error ('Must provide session configuration');

  this._server = oauth2orize.createServer ();

  // Serialization/deserialization
  this._server.serializeClient (function (client, done) {
    return done (null, client.id);
  });

  this._server.deserializeClient (function (id, done) {
    Client.findById (id, done);
  });

  // Register supported grant types.

  // Authorization Codes
  this._server.grant ('code',
    oauth2orize.grant.code (function (client, redirect_uri, user, ares, done) {
      var code = utils.generateToken (CODE_TOKEN_LENGTH);

      // Store the authorization code in the database. We are going to have
      // to retrieve it later when giving out the token.
      var ac = new oauth2.AuthorizationCode ({
        code : code,
        client : client.id,
        redirect_uri : redirect_uri,
        account : user.id
      });

      ac.save (function (err) {
        return err ? done (err) : done (null, code);
      });
    }));

  // Register the supported exchanges.

  this._server.exchange ('code',
    oauth2orize.exchange.code (function (client, code, redirect_uri, done) {
    // Make sure the client is not disabled before we continue with
    // exchanging the code for one or more token.
    if (client.disabled)
      return done (null, false);

    winston.log ('info', 'client %s exchanging authorization code for access token', client.id);
    var query = {code : code, client : client.id, redirect_uri : redirect_uri };

    oauth2.AuthorizationCode.findOne (query, function (err, code) {
      // Make sure there were no error, and we actually found an entry that
      // matched our criteria.
      if (err)
        return done (err);

      if (!code)
        return done (null, false);

      // Remove the entry from the database since it is no longer needed.
      // We then are going to convert the entry into an access token that
      // can be returned to the client. The token will then be used by the
      // client to access the APIs.
      code.remove (function (err, code) {
        if (err)
          return done (err);

        var token = utils.generateToken (ACCESS_TOKEN_LENGTH);
        var refreshToken = utils.generateToken (ACCESS_TOKEN_LENGTH);

        var accessToken = new AccessToken ({
          token : token,
          refresh_token : refreshToken,
          account : code.account,
          client : code.client
        });

        accessToken.save (function (err) {
          return err ? done (err) : done (null, token, refreshToken);
        });
      });
    });
  }));

  this._server.exchange ('password',
    oauth2orize.exchange.password (function (client, username, password, scope, done) {
      // First, verify the user's password. Once we have verified the password, we can issue
      // an access token for this user.
      winston.log ('info', 'client %s authenticating password for %s', client.id, username);

      Account.authenticate (username, password, function (err, account) {
        if (err)
          return done (new oauth2orize.TokenError (err.message, 'invalid_client'));

        winston.log('info', 'client %s generating access/refresh token for %s', client.id, username);
        AccessToken.generateAndSave(ACCESS_TOKEN_LENGTH, client.id, account.id, function (err, accessToken, refreshToken) {
          return done (err, accessToken, refreshToken, {});
        });
      });
    }));


  this._server.exchange ('refresh_token',
    oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
    // Make sure the client is allowed to refresh its token. We do not want
    // to allow unauthorized clients access to protected resources.
    if (client.disabled)
      return done (new oauth2orize.AuthorizationError ('Client is disabled', 'unauthorized_client'));

    // Locate the original access token that corresponds to this refresh
    // token. If we cannot find the original access token, then we need to
    // return an error to the user.
    winston.log ('client %s is refreshing access token', client.id);

    AccessToken.findOne ({client : client.id, refresh_token: refresh_token}, function (err, at) {
      if (err)
        return done (new oauth2orize.AuthorizationError (err.message, 'invalid_request'));

      if (!at)
        return done (new oauth2orize.TokenError ('Access token is not valid', 'invalid_request'));

      // Refresh and save the access token.
      at.refreshAndSave (function (err, accessToken, refreshToken) {
        return done (err, accessToken, refreshToken);
      });
    });
  }));
}

/**
 * Finalize user authorization to receiving a token that can be used to access
 * protected resources.
 *
 * @returns {Function}
 */
Oauth20Router.prototype.respondWithTransaction = function () {
  return function (req, res) {
    winston.info ('finalizing the authorization request');

    res.send (200, {
      transactionID: req.oauth2.transactionID,
      user: {
        id: req.user.id,
        username : req.user.username
      },
      client: {
        id : req.oauth2.client.id,
        name : req.oauth2.client.name,
      }
    });
  };
};

/**
 * Create handler method to ensure the user is logged in.
 *
 * @returns {Function}
 */
Oauth20Router.prototype.ensureLoggedIn = function () {
  return function (req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated ())
      return res.send (401, {message: 'User is not logged in'});

    return next ();
  }
};

/**
 * Create the Router object for this strategy.
 *
 * @returns {Router}
 */
Oauth20Router.prototype.get = function () {
  var router = express.Router ();

  // This endpoint is used by all OAuth 2.0 authentication approaches to
  // provide a token.
  router.post('/oauth2/token',
    [
      passport.authenticate (['oauth2-client', 'oauth2-client-password'], {session : false}),
      this._server.token (),
      this._server.errorHandler()
    ]
  );

  // We support password authentication. The flow for this authentication is:
  //
  // (1) authorize the trusted client
  // (2) authenticate the username/password
  // (3) exchange the credentials for an access token

  router.post ('/oauth2/password',
    [
      passport.authenticate ('oauth2-client', { session : false }),
      this._server.token (),
      this._server.errorHandler ()
    ]
  );

  // We support the code authentication. The flow for this authentication is:
  //
  // (1) login the user with their username/password
  // (2) authorize the client
  // (3) decide if the third-party has access
  // (4) exchange the code for an access token

  if (0) {
    router.post('/oauth2/login',
      [
        passport.authenticate ('local'),
        function (req, res) {return res.send(200, {}); }
      ]
    );

    router.get('/oauth2/authorize',
      [
        this.ensureLoggedIn (),
        passport.authenticate ('oauth2-client', { session : false }),
        this.respondWithTransaction (),
        this._server.errorHandler ({ mode: 'indirect' })
      ]
    );

    router.post('/oauth2/decision',
      [
        this.ensureLoggedIn (),
        this._server.decision (),
        this._server.errorHandler ({ mode: 'indirect' })
      ]
    );
  };

  return router;
};

module.exports = exports = function (opts) {
  return new Oauth20Router (opts).get ();
};



