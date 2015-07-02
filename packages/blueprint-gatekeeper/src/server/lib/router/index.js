var express = require ('express')
  , winston = require ('winston')
  ;

var AccountController = require ('../controllers/accountController')
  , AccessToken       = require ('../models/oauth2/accessToken')
  ;

function MainRouter (opts) {
  this._opts = opts || {};
}

MainRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var accountController = new AccountController ();

  router.post ('/accounts', accountController.createAccount ());

  router.use (require ('./oauth2/index') (this._opts));

  return router;
};

module.exports = exports = MainRouter;
