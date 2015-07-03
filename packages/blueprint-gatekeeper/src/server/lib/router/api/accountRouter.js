var express = require ('express');

var AccountController = require ('../../controllers/accountController');

function AccountRouter (opts) {
  this._opts = opts || {};
}

AccountRouter.prototype.makeRouter = function () {
  var accountController = new AccountController ();
  var router = express.Router ();

  router.param  ('account_id', accountController.lookupAccountParam ());
  router.delete ('/accounts/:account_id', accountController.deleteAccount ());
  router.post   ('/accounts/:account_id/enable', accountController.enableAccount ());
  router.post   ('/accounts/:account_id/scope', accountController.updateScope ());

  return router;
};

exports = module.exports = AccountRouter;
