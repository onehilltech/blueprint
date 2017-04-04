var jwt = require ('jsonwebtoken')
  ;

const DEFAULT_ALGORITHM = 'HS256';

function JwtToken (opts) {
  this._opts = opts || {};

  if (!this._opts.secret && !(this._opts.publicKey && this._opts.privateKey))
    throw new Error ('Must provide secret or publicKey/privateKey option');
}

JwtToken.prototype.generateToken = function (payload, options, callback) {
  var hash = this._opts.secret || this._opts.privateKey;

  if (this._opts.privateKey)
    options.algorithm = this._opts.algorithm || DEFAULT_ALGORITHM;

  if (this._opts.issuer)
    options.issuer = options.issuer || this._opts.issuer;

  if (this._opts.subject)
    options.subject = options.subject || this._opts.subject;

  if (this._opts.audience)
    options.audience = options.audience || this._opts.audience;

  if (this._opts.expiresIn)
    options.expiresIn = options.expiresIn || this._opts.expiresIn;

  return jwt.sign (payload, hash, options, callback);
};

JwtToken.prototype.verifyToken = function (token, opts, callback) {
  var hash = this._opts.secret || this._opts.publicKey;

  if (this._opts.publicKey)
    opts.algorithms = [this._opts.algorithm || DEFAULT_ALGORITHM];

  if (this._opts.issuer)
    opts.issuer = opts.issuer || this._opts.issuer;

  if (this._opts.subject)
    opts.subject = opts.subject || this._opts.subject;

  if (this._opts.audience)
    opts.audience = opts.audience || this._opts.audience;

  return jwt.verify (token, hash, opts, callback);
};

module.exports = exports = JwtToken;