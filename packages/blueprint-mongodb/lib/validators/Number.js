'use strict';

const util = require ('util');

const kinds = [
  'Decimal',
  'Float',
  'Int',
  'Numeric'
];

module.exports = function (path) {
  var schema = {};

  const validation = path.options.validation;

  if (validation) {
    if (validation.kind) {
      var kind = validation.kind;

      if (kinds.indexOf (kind) === -1)
        throw new Error (util.format ('Invalid number kind: %s', kind));

      schema['is' + kind] = {
        errorMessage: util.format ('Invalid/missing %s', kind)
      };
    }
  }

  return schema;
};
