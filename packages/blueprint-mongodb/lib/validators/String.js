'use strict';

const util = require ('util');

module.exports = function (path) {
  var schema = {
    notEmpty: true
  };

  if (path.options.enum) {
    // The path is an enumeration. We can convert this to a isIn() check
    // to constrain the set of accepted strings.
    var enums = path.options.enum;

    schema.isIn = {
      options: [enums],
      errorMessage: util.format ('Expected %s', util.inspect (enums))
    }
  }

  const validation = path.options.validation;

  if (validation) {
    if (validation.kind) {
      var kind = validation.kind;

      schema['is' + kind] = {
        errorMessage: util.format ('invalid %s', kind)
      };
    }
  }

  return schema;
};

