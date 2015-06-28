var express           = require ('express')
  , winston           = require ('winston');

var AdminController   = require ('../../controllers/adminController')
  , AccountController = require ('../../controllers/accountController')
  ;

var OAuth2Router = require ('./oauth2Router')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();

  var adminController = new AdminController ();
  var accountController = new AccountController ();

  // Get the home page for the administration portal.
  router.get    ('/admin', adminController.getHomePage ());

  // Define the account routes.
  router.param  ('account_id', accountController.lookupAccountParam ());
  router.get    ('/admin/accounts', accountController.getAccounts ());
  router.get    ('/admin/accounts/:account_id', accountController.getAccount ());
  router.delete ('/admin/accounts/:account_id', accountController.deleteAccount ());
  router.post   ('/admin/accounts/:account_id/enable', accountController.enableAccount ());
  router.post   ('/admin/accounts/:account_id/scope', accountController.updateScope ());

  // Load the Oauth 2.0 admin routes
  router.use ('/', new OAuth2Router ().makeRouter ());

  return router;
};

exports = module.exports = AdminRouter;
