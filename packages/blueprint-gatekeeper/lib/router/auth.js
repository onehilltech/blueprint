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

  router.post ('/auth/login', 
    passport.authenticate ('local', { failureRedirect: '/auth/login' }),
    function (req, res) {
      res.redirect ('/');
    });

  var logout = function (req, res) {
    req.session.destroy (function (err) {
      if (err)
        return res.send (400, {message: 'Failed to logout user'});

      // Logout the current user (in Passport).
      req.logout ();
      res.redirect ('/auth/login');
    });
  }

  router.get ('/auth/logout', 
    [ login.ensureLoggedIn (),
      logout]);

  return router;
};
