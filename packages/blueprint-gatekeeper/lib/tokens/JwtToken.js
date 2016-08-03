var jwt = require ('jsonwebtoken')
  ;

function JwtToken (opts) {
  this._opts = opts || {};

  if (!this._opts.secret && !(this._opts.publicKey && this._opts.privateKey))
    throw new Error ('Must provide secret or publicKey/privateKey option');
}

JwtToken.prototype.generateToken = function (opts, callback) {
  var payload = opts.payload;
  var options = opts.options;

  var hash = this._opts.secret || this._opts.privateKey;
  return jwt.sign (payload, hash, options, callback);
};

JwtToken.prototype.verifyToken = function (token, opts, callback) {
  var hash = this._opts.secret || this._opts.publicKey;
  return jwt.verify (token, hash, opts, callback);
};

module.exports = exports = JwtToken;
