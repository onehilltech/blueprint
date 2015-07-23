var express           = require ('express')
  , winston           = require ('winston')
  , AccountController = require ('../../controllers/accountController')
  ;

function AccountRouter (opts) {
  this._opts = opts || {};
  this.baseuri = '/admin/accounts';
}

AccountRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var accountController = new AccountController ();

  // Define the account routes.
  router.param ('account_id', accountController.lookupAccountParam ());
  router.get   ('/admin/accounts', accountController.viewAccounts ());
  router.get   ('/admin/accounts/:account_id', accountController.viewAccount ());
  
  return router;
};

exports = module.exports = AccountRouter;

