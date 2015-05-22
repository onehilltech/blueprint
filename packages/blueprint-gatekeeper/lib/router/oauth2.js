var passport    = require ('passport')
  , local       = require ('passport-local')
  , express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  ;

var AccessToken = require ('../models/access-token')
  , Client      = require ('../models/client')
  , oauth2      = require ('../models/oauth2')
  , utils       = require ('../utils')
  ;

const ACCESS_TOKEN_LENGTH = 256;
const CODE_TOKEN_LENGTH = 16;

// Use the client authentication strategy.
passport.use (require ('../authentication/client') ());
passport.use (require ('../authentication/local') ());

/**
 * @class OAuth20Strategy
 *
 * The OAuth 2.0 strategy for the framework.
 */
function OAuth20Strategy (opts) {
  this._opts = opts || {};

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

  // OAuth 2.0 specifies a framework that allows users to grant client
  // applications limited access to their protected resources.  It does this
  // through a process of the user granting access, and the client exchanging
  // the grant for an access token.

  // Grant authorization codes.  The callback takes the `client` requesting
  // authorization, the `redirectURI` (which is used as a verifier in the
  // subsequent exchange), the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a code, which is bound to these
  // values, and will be exchanged for an access token.

  // Authorization Codes
  this._server.grant ('code', oauth2orize.grant.code (function (client, redirect_uri, user, ares, done) {
    // Generate a new authorization code.
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

  // Exchange authorization codes for access tokens.  The callback accepts the
  // `client`, which is exchanging `code` and any `redirectURI` from the
  // authorization request for verification.  If these values are validated, the
  // application issues an access token on behalf of the user who authorized the
  // code.

  this._server.exchange ('code', oauth2orize.exchange.code (function (client, code, redirect_uri, done) {
    // Make sure the client is not disabled before we continue with
    // exchanging the code for one or more token.
    if (client.disabled)
      return done (null, false);

    var query = {code : code, client : client.id, redirect_uri : redirect_uri };

    winston.info ('exchanging code for access token');
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

  this._server.exchange ('refresh_token', oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
    // Make sure the client is allowed to refresh its token. We do not want
    // to allow unauthorized clients access to protected resources.
    if (client.disabled)
      return done (null, false);

    // Locate the original access token that corresponds to this refresh
    // token. If we cannot find the original access token, then we need to
    // return an error to the user.
    winston.info ('refreshing access token');
    AccessToken.findOne ({client : client.id, refresh_token: refresh_token}, function (err, at) {
      if (err)
        return done (err);

      if (!at)
        return done (null, false);

      // Generate a new token and refresh token.
      at.token = utils.generateToken (ACCESS_TOKEN_LENGTH);
      at.refresh_token = utils.generateToken (ACCESS_TOKEN_LENGTH);

      at.save (function (err) {
        return err ? done (err) : done (null, at.token, at.refresh_token);
      });
    });
  }));

  this._authorization = this._server.authorization (function (client_id, redirect_uri, done) {
    winston.info ('performing client authorization');

    Client.findById (client_id, function (err, client) {
      if (err)
        return done (err);

      // For security purposes,check that redirect URI provided by the
      // client matches one registered with the server.
      if (client.redirect_uri !== redirect_uri)
        return done (new Error ('Redirect uri does not match'));

      // Make sure the client is not disabled before we begin a new transaction
      // for authorizing access to our protected resources.
      if (client.disabled)
        return done (new Error ('Client access is disabled'));

      return done (null, client, redirect_uri);
    });
  });
}

/**
 * Finalize user authorization to receiving a token that can be used to access
 * protected resources.
 *
 * @returns {Function}
 */
OAuth20Strategy.prototype.finalizeAuthorization = function () {
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
OAuth20Strategy.prototype.ensureLoggedIn = function () {
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
OAuth20Strategy.prototype.router = function () {
  var router = express.Router ();

  // Make sure we include the username/password routes
  //router.use (session (this._opts.session));
  router.use (passport.session ());

  router.post (
    '/oauth2/login',
    passport.authenticate ('local'),
    function (req, res) {
      return res.send (200, {});
    }
  );

  router.get (
    '/oauth2/authorize',
    this.ensureLoggedIn (),
    this._authorization,
    this.finalizeAuthorization ()
  );

  router.post (
    '/oauth2/decision',
    this.ensureLoggedIn (),
    this._server.decision ()
  );

  router.post (
    '/oauth2/token',
    passport.authenticate (['oauth2-client-password'], { session: false }),
    this._server.token (),
    this._server.errorHandler ()
  );

  return router;
};

module.exports = exports = function (opts) {
  return new OAuth20Strategy (opts).router ();
};



