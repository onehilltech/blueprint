'use strict';

const Error = require ('./BlueprintError')
  , util    = require ('util')
  ;

module.exports = HttpError;

/**
 * @class HttpError
 *
 * Base class for all http errors.
 *
 * @param statusCode      Http status code
 * @param code            Error code
 * @param message         Error message
 * @param details         Optional details about the error
 * @constructor
 */
function HttpError (statusCode, code, message, details) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.call (this, code, message, details);

  this.statusCode = statusCode;
}

util.inherits (HttpError, Error);

HttpError.prototype.accept = function (v) {
  v.visitHttpError (this);
};
