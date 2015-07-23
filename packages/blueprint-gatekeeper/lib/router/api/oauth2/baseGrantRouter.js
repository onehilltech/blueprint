const DEFAULT_TOKEN_LENGTH = 256;

function BaseGrantRouter (name, opts, server) {
  this.name = name;
  this._opts = opts;
  this._server = server;

  this._tokenLength = this._opts.tokenLength || DEFAULT_TOKEN_LENGTH;
}

BaseGrantRouter.prototype.appendRouter = function (router) {
  throw new Error ('Subclass must implement appendRouter ()');
}

BaseGrantRouter.prototype.getSupportsRefreshToken = function () {
  return false;
}

BaseGrantRouter.prototype.getRefreshTokenAuthenticateStrategy = function () {
  return null;
}

module.exports = exports = BaseGrantRouter;
