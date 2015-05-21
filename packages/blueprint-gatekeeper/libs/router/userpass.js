var passport = require ('passport')
  , express = require ('express')
  , winston = require ('winston')
  , login = require ('connect-ensure-login')
  ;

var local = require ('../authentication/local')
  , Client = require ('../models/client')
  , AccessToken = require ('../models/access-token')
  , utils = require ('../utils')
  ;

const DEFAULT_TOKEN_LENGTH = 256;

// Use the local authentication strategy.
passport.use (local ());

/**
 * @class UsernamePasswordStrategy
 *
 * @param opts
 * @constructor
 */
function UsernamePasswordStrategy (opts) {
  this._opts = opts || {};

  this.loginRoute = opts.loginRoute || '/auth/login';
  this.loginSuccessRedirect = opts.loginSuccessRedirect || '/';

  this.logoutRoute = opts.logoutRoute || '/auth/logout';
  this.logoutSuccessRedirect = opts.logoutSuccessRedirect || this.loginRoute;

  this.tokenLength = opts.tokenLength || DEFAULT_TOKEN_LENGTH;
  this.clients = opts.clients || [];
}

/**
 * Authenticate if the client accessing the route is actually allowed
 * to access it. This is done by checking if the client is in the
 * authorized list of clients set at deployment time.
 */
UsernamePasswordStrategy.prototype.authenticateClient = function () {
  var _this = this;

  return function (req, res, next) {
    var clientId = req.body.client;
    var clientSecret = req.body.client_secret;

    winston.info ('authenticating login client %s', clientId);

    if (!clientId || !clientSecret)
      return next (new Error ('Missing client credentials'));

    Client.findById (clientId, function (err, client) {
      // Make sure there are no errors and direct login is supported by
      // the client.
      if (err)
        return next (err);

      if (!client)
        return res.send (400, 'Client does not exist');

      if (!client.direct_login)
        return res.send (403, 'Client does not support direct login');

      if (client.secret !== clientSecret)
        return res.send (400, 'Client secret is incorrect');

      winston.info ('client authentication successful');
      req.client = client;

      return next ();
    });
  };
}

/**
 * Execute the login operation. The login operation will create a new
 * access token for the user, and store it in the database. The client
 * performing the login will be set as the hosting client.
 */
UsernamePasswordStrategy.prototype.finalizeLogin = function () {
  var _this = this;

  return function (req, res, next) {
    try {
      winston.info ('finalizing the login process');

      var token = new AccessToken ({
        token : utils.generateToken (_this.tokenLength),
        refresh_token : utils.generateToken (_this.tokenLength),
        account : req.user,
        client : req.client
      });

      winston.info ('saving access/refresh token to the database');

      token.save (function (err) {
        if (err)
          return next (err);

        winston.info ('sending access/refresh token to user');
        res.send (200, {token: token.token, refresh_token: token.refresh_token});
      });
    }
    catch (err) {
      winston.error (err.message);
    }
  };
};

/**
 * Finalize the logout process. This will erase the current session, perform a logout, and
 * redirect to the logout URI.
 *
 * @returns {Function}
 */
UsernamePasswordStrategy.prototype.finalizeLogout = function () {
  return function (req, res) {
    req.session.destroy (function (err) {
      if (err)
        return res.send (400, {message: 'Failed to logout user'});

      // Logout the current user (in Passport).
      req.logout ();
      res.redirect (redirectUri);
    });
  }
};

/**
 * Create a Express.js Router object based on the current configuration.
 *
 * @returns {Router}
 */
UsernamePasswordStrategy.prototype.router = function () {
  var router = express.Router ();

  router.post (
    this.loginRoute,
    this.authenticateClient (),
    passport.authenticate ('local', { failureRedirect: this.loginRoute }),
    this.finalizeLogin ());

  router.get (
    this.logoutRoute,
    passport.authenticate ('bearer', { failureRedirect: this.loginRoute }),
    this.finalizeLogout ());

  return router;
};

module.exports = exports = function (opts) {
  return new UsernamePasswordStrategy (opts).router ();
};
