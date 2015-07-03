var express  = require ('express')
  , winston  = require ('winston')
  , passport = require ('passport')
  ;

var AdminController   = require ('../../controllers/adminController')
  , AccountController = require ('../../controllers/accountController')
  , OAuth2Router      = require ('./oauth2Router')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var adminController = new AdminController ();
  var accountController = new AccountController ();

  // Get the home page for the administration portal.
  router.get ('/admin', [
      adminController.isLoggedIn (),
      adminController.viewHomePage ()
    ]);

  router.get  ('/admin/login', adminController.viewLoginPage ());
  router.post ('/admin/login', adminController.authenticate ());
  router.get  ('/admin/logout', adminController.logout ());

  // Define the account routes.
  router.param ('account_id', accountController.lookupAccountParam ());
  router.use   ('/admin/accounts', adminController.isLoggedIn ());
  router.get   ('/admin/accounts', accountController.viewAccounts ());
  router.get   ('/admin/accounts/:account_id', accountController.viewAccount ());

  // Load the Oauth 2.0 admin routes
  router.use ('/', new OAuth2Router ().makeRouter ());

  return router;
};

exports = module.exports = AdminRouter;
