var passport = require ('passport');
var express = require ('express');
var login = require ('connect-ensure-login');
var local = require ('../authentication/local');
var util = require ('util');

// Use the local authentication strategy.
passport.use (local ());

/**
 * Execute the login operation.
 */
function executeLogin (redirectUri) {
  return function (req, res) {
    return res.redirect (redirectUri);
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

  router.post (loginRoute, 
               passport.authenticate ('local', { failureRedirect: loginRoute }),
               executeLogin (loginSuccessRedirect));

  router.get (logoutRoute, 
              login.ensureLoggedIn ({redirectTo: loginRoute}),
              executeLogout (logoutSuccessRedirect));

  return router;
};
