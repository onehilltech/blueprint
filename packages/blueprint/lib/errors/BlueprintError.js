'use strict';

var util = require ('util');

module.exports = BlueprintError;

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
function BlueprintError (code, message, details) {
  Error.captureStackTrace (this, this.constructor);

  this.name = this.constructor.name;
  this.code = code;
  this.message = message;
  this.details = details;
}

util.inherits (BlueprintError, Error);

BlueprintError.prototype.accept = function (v) {
  v.visitBlueprintError (this);
};
