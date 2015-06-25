var express = require ('express')
  , winston = require ('winston')
  , AccessToken = require ('../models/oauth2/accessToken')
  ;

function MainRouter (opts) {
  this._opts = opts || {};
}

MainRouter.prototype.get = function () {
  var router = express.Router ();

  router.use (require ('./oauth2/index') (this._opts));

  return router;
};

module.exports = exports = function (opts) {
  return new MainRouter (opts).get ();
};
