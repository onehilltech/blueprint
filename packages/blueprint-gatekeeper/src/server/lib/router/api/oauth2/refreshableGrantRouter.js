var BaseGrantRouter = require ('./baseGrantRouter')
  , util = require ('util')
  ;

function RefreshableGrantRouter (name, opts, server) {
  BaseGrantRouter.call (this, name, opts, server);
}

util.inherits (RefreshableGrantRouter, BaseGrantRouter);

RefreshableGrantRouter.prototype.getSupportsRefreshToken = function () {
  return true;
}

RefreshableGrantRouter.prototype.getRefreshTokenAuthenticateStrategy = function () {
  throw new Error ('Must implement getRefreshTokenAuthenticateStrategy ()');
}

module.exports = exports = RefreshableGrantRouter;
