var express  = require ('express')
  , winston  = require ('winston')
  , passport = require ('passport')
  ;

var AdminRouter = require ('./admin')
  , ApiRouter   = require ('./api')
  , bearer      = require ('../authentication/bearer')
  ;

passport.use (bearer ());

function MainRouter (opts) {
  this._opts = opts || {};
}

MainRouter.prototype.makeRouter = function () {
  var router = express.Router ();

  router.use (new AdminRouter (this._opts).makeRouter ());
  router.use ('/api', new ApiRouter ().makeRouter ());

  return router;
};

module.exports = exports = MainRouter;
