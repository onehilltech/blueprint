var passport = require ('passport')
  , express  = require ('express')
  ;

function ProtectedRouter () {

}

ProtectedRouter.prototype.newRouter = function () {
  var router = express.Router ();
  router.use (passport.authenticate ('bearer', {session : false}));

  return router;
};

exports = module.exports = ProtectedRouter;
