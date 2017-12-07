const BlueprintError = require ('./error');

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
class HttpError extends BlueprintError {
  constructor (statusCode, code, message, details) {
    super (code, message, details);

    this.statusCode = statusCode;
  }

  accept (v) {
    v.visitHttpError (this);
  }
}

module.exports = HttpError;
