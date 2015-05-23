var express = require ('express')
  , winston = require ('winston')
  , AccessToken = require ('../models/access-token')
  ;

function MainRouter (opts) {
  this._opts = opts || {};
}

MainRouter.prototype.get = function () {
  var router = express.Router ();

  router.use (require ('./oauth2') (this._opts));

  return router;
};

module.exports = exports = function (opts) {
  return new MainRouter (opts).get ();
};
