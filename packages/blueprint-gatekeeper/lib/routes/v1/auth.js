var passport = require ('passport'),
    local    = require ('../../authentication/local');

// Use the local authentication strategy.
passport.use (local ());

module.exports = function (prefix, router) {
  router.post ('/auth/login', 
    passport.authenticate ('local', { failureRedirect: prefix + '/auth/login' }),
    function (req, res) {
      res.redirect ('/');
    });

  router.get  ('/auth/logout', function (req, res) {
    // Destroy the user's session information.
    req.session.destroy (function (err) {
      if (err)
        return res.send (400, {message: 'Failed to logout user'});

      // Logout the current user (in Passport).
      req.logout ();
      res.redirect (prefix + '/auth/login');
    });
  }); 
};
