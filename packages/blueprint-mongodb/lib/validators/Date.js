'use strict';

const util = require ('util');

module.exports = function (path) {
  var schema = { };

  const validation = path.options.validation;

  if (validation) {
    if (validation.kind && validation.kind === 'Numeric') {
      schema.isNumeric = {
        errorMessage: 'Invalid numeric date'
      }
    }
    else {
      schema.isDate = {
        errorMessage: 'Invalid date format'
      };
    }
  }
  else {
    // There is no defined validation. We are going to assume the client
    // is uploading a date string.
    schema.isDate = {
      errorMessage: 'Invalid date format'
    };
  }

  return schema;
};
