var passport = require ('passport'),
    express  = require ('express'),
    login    = require ('connect-ensure-login'),
    local    = require ('../authentication/local');

// Use the local authentication strategy.
passport.use (local ());

module.exports = exports = function (opts) {
  console.log ('configuring local authentication routes');

  // Create a router for these routes.
  var router = express.Router ();
  opts = opts || {};

  var loginRoute = opts.loginRoute || '/auth/login';
  var loginSuccessRedirect = opts.loginSuccessRedirect || '/';

  var logoutRoute = opts.logoutRoute || '/auth/logout';
  var logoutSuccessRedirect = opts.logoutSuccessRedirect || loginRoute;

  router.post (loginRoute, 
    passport.authenticate ('local', { failureRedirect: loginRoute }),
    function (req, res) {
      res.redirect (loginSuccessRedirect);
    });

  function performLogout () {
    return function (req, res) {
      req.session.destroy (function (err) {
        if (err)
          return res.send (400, {message: 'Failed to logout user'});

        // Logout the current user (in Passport).
        req.logout ();
        res.redirect (logoutSuccessRedirect);
      });
    }
  }

  router.get (logoutRoute, 
    [ login.ensureLoggedIn ({redirectTo: loginRoute}),
      performLogout ()]);

  return router;
};
