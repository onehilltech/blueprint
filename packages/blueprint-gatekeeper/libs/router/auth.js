var passport = require ('passport');
var express = require ('express');
var login = require ('connect-ensure-login');
var util = require ('util');

var local = require ('../authentication/local');

var Client = require ('../models/oauth2/client');
var AccessToken = require ('../models/oauth2/access-token');

var utils = require ('../utils');

const DEFAULT_TOKEN_LENGTH = 256;

// Use the local authentication strategy.
passport.use (local ());

/**
 * Authenticate the client access this route is actually allowed to
 * access the route. This is done by checking if the client is in the
 * authorized list of clients set at deployment time.
 */
function authenticateLoginClient () {
  return function (req, res, next) {
    var clientId = req.body.client;
    var clientSecret = req.body.client_secret;

    if (!clientId || !clientSecret)
      return next (new Error ('missing credentials'));

    Client.findById (clientId, function (err, client) {
      // Make sure there are no errors, the client support direct login,
      // and the client's secret is correct before moving onto the next
      // middlware handler. We are also going to cache the client for the
      // next middleware handler.
      if (err)
        return next (err);

      if (!client)
        return res.send (400, 'Client does not exist');

      if (!client.direct_login)
        return res.send (403, 'Client does not support direct login');

      if (client.secret !== clientSecret)
        return res.send (400, 'Client secret is incorrect');

      req.client = client;
      return next ();
    });
  }
}


/**
 * Execute the login operation. The login operation will create a new
 * access token for the user, and store it in the database. The client
 * performing the login will be set as the hosting client.
 */
function executeLogin (opts) {
  opts = opts || {};

  var tokenLength = opts.tokenLength || DEFAULT_TOKEN_LENGTH;

  return function (req, res, next) {
    var accessToken = new AccessToken ({
      token : utils.generateToken (DEFAULT_TOKEN_LENGTH),
      refresh_token : utils.generateToken (DEFAULT_TOKEN_LENGTH),
      account : req.user,
      client : req.client,
    })

    accessToken.save (function (err) {
      if (err)
        return next (err);

      res.send (200, {token: accessToken.token, refresh_token: accessToken.refresh_token});
    });
  }
}

/**
 * Execute the logout operation.
 */
function executeLogout (redirectUri) {
  return function (req, res) {
    req.session.destroy (function (err) {
      if (err)
        return res.send (400, {message: 'Failed to logout user'});

      // Logout the current user (in Passport).
      req.logout ();
      res.redirect (redirectUri);
    });
  }
}

module.exports = exports = function (opts) {
  opts = opts || {};

  var router = express.Router (opts);
  var loginRoute = opts.loginRoute || '/auth/login';
  var loginSuccessRedirect = opts.loginSuccessRedirect || '/';

  var logoutRoute = opts.logoutRoute || '/auth/logout';
  var logoutSuccessRedirect = opts.logoutSuccessRedirect || loginRoute;

  var tokenLength = opts.tokenLength || DEFAULT_TOKEN_LENGTH;
  var clients = opts.clients || [];

  // The GET|POST verbs for the login route
  router.post (loginRoute, 
               authenticateLoginClient (),
               passport.authenticate ('local', { failureRedirect: loginRoute }),
               executeLogin (loginSuccessRedirect));

  // The routes for logout.
  router.get (logoutRoute, 
              login.ensureLoggedIn ({redirectTo: loginRoute}),
              executeLogout (logoutSuccessRedirect));

  return router;
};
