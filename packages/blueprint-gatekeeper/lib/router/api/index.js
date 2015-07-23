var express  = require ('express')
  ;

var routerFiles = [
  './oauth2',
  './accountRouter'
];

function ApiRouter (opts) {
  this._opts = opts || {};
}

ApiRouter.prototype.makeRouter = function () {
  var router = express.Router ();

  routerFiles.forEach (function (file) {
    var Router = require (file);
    router.use (new Router ().makeRouter ());
  });

  return router;
};

exports = module.exports = ApiRouter;