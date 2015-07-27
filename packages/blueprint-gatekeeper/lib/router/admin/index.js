var express  = require ('express')
  , winston  = require ('winston')
  , passport = require ('passport')
  ;

var AdminViewController = require ('../../controllers/')
  ;

const protectedRoutes = [
  './accountRouter',
  './oauth2Router'
]

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.makeRouter = function () {
  winston.info ('making administrator router');
  var router = express.Router ();
  var adminViewController = new AdminViewController ();

  // Get the home page for the administration portal.
  router.get  ('/admin', [
    adminViewController.isLoggedIn (),
    adminViewController.viewHomePage ()
  ]);

  router.get  ('/admin/login', adminViewController.viewLoginPage ());
  router.post ('/admin/login', adminViewController.authenticate ());
  router.get  ('/admin/logout', adminViewController.logout ());

  // Load the protected routes (i.e., the routes that require the user to
  // be logged in to access).
  var self = this;

  protectedRoutes.forEach (function (protectedRoute) {
    var ProtectedRouter = require (protectedRoute);
    var protectedRouter = new ProtectedRouter (self._opts);

    router.use (protectedRouter.baseuri, adminViewController.isLoggedIn ());
    router.use ('/', protectedRouter.makeRouter ());
  });

  return router;
};

exports = module.exports = AdminRouter;
