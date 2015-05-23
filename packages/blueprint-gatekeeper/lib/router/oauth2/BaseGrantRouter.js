const DEFAULT_TOKEN_LENGTH = 256;

function BaseGrantRouter (name, opts, server) {
  this.name = name;
  this._opts = opts;
  this._server = server;

  this._tokenLength = this._opts.tokenLength || DEFAULT_TOKEN_LENGTH;
}

BaseGrantRouter.prototype.getRouter = function (router) {
  throw new Error ('Subclass must implement getRouter ()');
}

module.exports = exports = BaseGrantRouter;
