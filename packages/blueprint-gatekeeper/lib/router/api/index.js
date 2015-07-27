var express  = require ('express')
  ;

var routerFiles = [
  './oauth2',
  './accountRouter'
];

function ApiRouter (opts) {
  this._opts = opts || {};
}

ApiRouter.prototype.makeRouter = function (models) {
  var router = express.Router ();

  routerFiles.forEach (function (file) {
    var Router = require (file);
    router.use (new Router ().makeRouter (models));
  });

  return router;
};

exports = module.exports = ApiRouter;