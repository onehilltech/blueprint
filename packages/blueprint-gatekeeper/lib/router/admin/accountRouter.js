var express           = require ('express')
  , winston           = require ('winston')
  ;

var AccountViewController = require ('../../controllers/internal/accountViewController')
  ;

function AccountRouter (opts) {
  this._opts = opts || {};
  this.baseuri = '/admin/accounts';
}

AccountRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var accountViewController = new AccountViewController ();

  // Define the account routes.
  router.param ('account_id', accountViewController.base.lookupAccountParam ());
  router.get   ('/admin/accounts', accountViewController.viewAccounts ());
  router.get   ('/admin/accounts/:account_id', accountViewController.viewAccount ());
  
  return router;
};

exports = module.exports = AccountRouter;

