var passport = require ('passport')
  , express = require ('express')
  , winston = require ('winston')
  , login = require ('connect-ensure-login')
  ;

var auth = require ('../authentication');

var Client = require ('../models/client')
  , AccessToken = require ('../models/access-token')
  , utils = require ('../utils')
  ;

const DEFAULT_TOKEN_LENGTH = 256;
const DEFAULT_LOGIN_ROUTE  = '/auth/login';
const DEFAULT_LOGOUT_ROUTE = '/auth/logout';

// Load the different authentication strategies needed. The local () strategy
// is for the username/password login. The bearer () is for authenticating the
// tokens for logout. The client () is for authenticating the client enabling
// access to the resources.
passport.use (auth.bearer ());
passport.use (auth.client ());
passport.use (auth.local ());

/**
 * @class UsernamePasswordRouter
 *
 * @param opts
 * @constructor
 */
function UsernamePasswordRouter (opts) {
  this._opts = opts || {};

  this.loginRoute = this._opts.loginRoute || DEFAULT_LOGIN_ROUTE;
  this.loginSuccessRedirect = this._opts.loginSuccessRedirect || '/';

  this.logoutRoute = this._opts.logoutRoute || DEFAULT_LOGOUT_ROUTE;
  this.logoutSuccessRedirect = this._opts.logoutSuccessRedirect || this.loginRoute;

  this.tokenLength = this._opts.tokenLength || DEFAULT_TOKEN_LENGTH;
  this.clients = this._opts.clients || [];
}

/**
 * Execute the login operation. The login operation will create a new
 * access token for the user, and store it in the database. The client
 * performing the login will be set as the hosting client.
 */
UsernamePasswordRouter.prototype.finalizeLogin = function () {
  var _this = this;

  return function (req, res, next) {
    winston.info ('finalizing the login process');

    var token = new AccessToken ({
      token : utils.generateToken (_this.tokenLength),
      refresh_token : utils.generateToken (_this.tokenLength),
      account : req.user.id,
      client : req.client.id
    });

    winston.info ('saving access/refresh token to the database');

    token.save (function (err) {
      if (err)
        return next (err);

      winston.info ('sending access/refresh token to user');
      res.send (200, {token: token.token, refresh_token: token.refresh_token});
    });
  };
};

/**
 * Finalize the logout process. This will erase the current session, perform a logout, and
 * redirect to the logout URI.
 *
 * @returns {Function}
 */
UsernamePasswordRouter.prototype.finalizeLogout = function () {
  return function (req, res, next) {
    winston.info ('removing access token from the database');
    AccessToken.findByIdAndRemove (req.authInfo.token_id, function (err) {
      if (err)
        return next (err);

      res.send (200, {});
    });
  };
};

/**
 * Create a Express.js Router object based on the current configuration.
 *
 * @returns {Router}
 */
UsernamePasswordRouter.prototype.router = function () {
  var router = express.Router ();

  // Define the login route. We must validate the client making the login request
  // for the user, and the username/password for the user. If either fails, then
  // the user cannot be logged in.
  router.post (
    this.loginRoute,
    passport.authenticate ('oauth2-client-password'),
    passport.authenticate ('local'),
    this.finalizeLogin ()
  );

  // Define the logout route. We must have a valid access token (i.e., Bearer) in
  // order to successfully logout the user. Upon logout, the token is no longer valid.
  router.post (
    this.logoutRoute,
    passport.authenticate ('bearer'),
    this.finalizeLogout ()
  );

  return router;
};

module.exports = exports = function (opts) {
  return new UsernamePasswordRouter (opts).router ();
};
