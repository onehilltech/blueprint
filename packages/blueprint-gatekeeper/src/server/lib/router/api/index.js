var express = require ('express');

var AccountRouter = require ('./accountRouter');

function ApiRouter (opts) {
  this._opts = opts || {};
}

ApiRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  router.use ('/', new AccountRouter ().makeRouter ());

  return router;
};

exports = module.exports = ApiRouter;