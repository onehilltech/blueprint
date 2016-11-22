'use strict';

const _        = require ('underscore')
  , objectPath = require ('object-path')
  , instances  = require ('./validators')
  ;

module.exports = makeValidationSchema;

function makeValidationForSchemaType (schemaType, opts) {
  // Build the general-purpose schema for the path.
  var schema = {};
  opts = opts || {};

  // The 'optional' property has to be the first key in the partial schema
  // object in order for validation by schema to work.
  var allOptional = opts.allOptional || false;

  if (!schemaType.isRequired ||
      objectPath.has (schemaType.options, 'default') ||
      objectPath.get (schemaType.options, 'validation.optional', false) ||
      allOptional)
  {
    schema.optional = true;
  }

  // Build the instance schema for the path.
  var instanceValidator = instances[schemaType.instance];

  if (instanceValidator) {
    var instanceSchema = instanceValidator (schemaType);
    schema = _.extend (schema, instanceSchema);
  }

  return schema;
}

function makeValidationSchema (schema, opts) {
  opts = opts || {};

  var pathPrefix = '';

  if (opts.pathPrefix)
    pathPrefix = opts.pathPrefix + '.';

  var validation = {};

  var pathOptions = {
    allOptional: opts.allOptional
  };

  schema.eachPath (function (path, schemaType) {
    var fullKey = pathPrefix + path;
    validation[fullKey] = makeValidationForSchemaType (schemaType, pathOptions);
  });

  return validation;
}
