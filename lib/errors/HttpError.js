/**
 * @class HttpError
 *
 * Base class for all http errors.
 *
 * @param statusCode
 * @param message
 * @constructor
 */
function HttpError (statusCode, message) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.captureStackTrace (this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = statusCode;
}

module.exports = exports = HttpError;
