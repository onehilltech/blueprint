var express  = require ('express')
  , winston  = require ('winston')
  , passport = require ('passport')
  ;

var AdminController = require ('../../controllers/adminController')
  ;

const protectedRoutes = [
  './accountRouter',
  './oauth2Router'
]

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var adminController = new AdminController ();

  // Get the home page for the administration portal.
  router.get  ('/admin', [
    adminController.isLoggedIn (),
    adminController.viewHomePage ()
  ]);

  router.get  ('/admin/login', adminController.viewLoginPage ());
  router.post ('/admin/login', adminController.authenticate ());
  router.get  ('/admin/logout', adminController.logout ());

  // Load the protected routes (i.e., the routes that require the user to
  // be logged in to access).
  protectedRoutes.forEach (function (protectedRoute) {
    var ProtectedRouter = require (protectedRoute);
    var protectedRouter = new ProtectedRouter ();

    router.use (protectedRouter.baseuri, adminController.isLoggedIn ());
    router.use ('/', protectedRouter.makeRouter ());
  });

  return router;
};

exports = module.exports = AdminRouter;
