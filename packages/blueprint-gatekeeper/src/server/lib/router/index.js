var express  = require ('express')
  , winston  = require ('winston')
  , passport = require ('passport')
  ;

var AdminRouter = require ('./admin')
  , ApiRouter   = require ('./api')
  ;

var bearer         = require ('../authentication/bearer')
  , clientPassword = require ('../authentication/clientPassword')
  ;

passport.use (bearer ());
passport.use (clientPassword ());

function MainRouter (opts) {
  this._opts = opts || {};
}

MainRouter.prototype.makeRouter = function () {
  var router = express.Router ();

  router.use ('/api', passport.authenticate (['bearer', 'oauth2-client-password'], {session : false}));
  router.use ('/api', new ApiRouter ().makeRouter ());
  router.use ('/', new AdminRouter ().makeRouter ());

  return router;
};

module.exports = exports = MainRouter;
