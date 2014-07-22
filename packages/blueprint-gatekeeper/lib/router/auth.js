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

  var login_route = opts.loginRoute || '/auth/login';
  var login_success_redirect = opts.loginSuccessRedirect || '/';

  var logout_route = opts.logoutRoute || '/auth/logout';
  var logout_success_redirect = opts.logoutSuccessRedirect || login_route;

  router.post (login_route, 
    passport.authenticate ('local', { failureRedirect: login_route }),
    function (req, res) {
      res.redirect (login_success_redirect);
    });

  function perform_logout () {
    return function (req, res) {
      req.session.destroy (function (err) {
        if (err)
          return res.send (400, {message: 'Failed to logout user'});

        // Logout the current user (in Passport).
        req.logout ();
        res.redirect (logout_success_redirect);
      });
    }
  }

  router.get (logout_route, 
    [ login.ensureLoggedIn ({redirectTo: login_route}),
      perform_logout ()]);

  return router;
};
