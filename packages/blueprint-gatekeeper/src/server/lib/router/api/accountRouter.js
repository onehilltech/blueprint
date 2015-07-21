var express = require ('express')
  , util    = require ('util')
  , winston = require ('winston')
  ;

var ProtectedRouter   = require ('../protectedRouter')
  , AccountController = require ('../../controllers/accountController');

function AccountRouter (opts) {
  ProtectedRouter.call (this);

  this._opts = opts || {};
}

util.inherits (AccountRouter, ProtectedRouter);

AccountRouter.prototype.makeRouter = function () {
  winston.info ('making account router');

  var accountController = new AccountController ();
  var router = this.newRouter ();

  router.param  ('account_id', accountController.lookupAccountParam ());
  router.delete ('/accounts/:account_id', accountController.deleteAccount ());
  router.post   ('/accounts/:account_id/enable', accountController.enableAccount ());
  router.post   ('/accounts/:account_id/scope', accountController.updateScope ());

  return router;
};

exports = module.exports = AccountRouter;
