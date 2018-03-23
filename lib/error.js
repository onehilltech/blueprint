/**
 * @class BlueprintError
 *
 * Base class for all errors in Blueprint. Each BlueprintError has an unique code,
 * an error message, and optional details about the error.
 *
 * @param code            Unique error code
 * @param message         Error message
 * @param details         Optional details about the error
 * @constructor
 */
class BlueprintError extends Error {
  constructor (code, message, details) {
    super (message);

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace (this, this.constructor);
    }
    else {
      this.stack = (new Error(message)).stack;
    }

    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.details = details;
  }

  accept (v) {
    v.visitBlueprintError (this);
  }
}

module.exports = BlueprintError;
