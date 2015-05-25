var BaseGrantRouter = require ('./baseGrantRouter');

const NAME = 'refresh_token';

// Use the client authentication strategy.
passport.use (require ('../../authentication/client') ());
passport.use (require ('../../authentication/clientPassword') ());

function RefreshableGrantRouter (name, opts, server) {
  BaseGrantRouter.call (this, NAME, opts, server);
}

util.inherits (RefreshableGrantRouter, BaseGrantRouter);

RefreshableGrantRouter.prototype.getSupportsRefreshToken = function () {
  return true;
}

RefreshableGrantRouter.prototype.getRefreshTokenAuthenticateStrategy = function () {
  throw new Error ('Must implement getRefreshTokenAuthenticateStrategy ()');
}

module.exports = exports = function (opts, server) {
  return new RefreshTokenRouter (opts, server);
};
