'use strict';

const _       = require ('underscore')
  , util      = require ('util')
  , instances = require ('./validators')
  ;

module.exports = makeValidationSchema;

function makeValidationSchemaForPath (path) {
  // Build the general-purpose schema for the path.
  var schema = {};

  if (!path.isRequired)
    schema.optional = true;

  // Build the instance schema for the path.
  var instanceValidator = instances[path.instance];

  if (instanceValidator) {
    var instanceSchema = instanceValidator (path);
    schema = _.extend (schema, instanceSchema);
  }

  return schema;
}

function makeValidationSchema (model, opts) {
  var opts = opts || {};
  var pathPrefix = (opts.pathPrefix + '.') || '';

  var schema = model.schema;
  var validation = {};

  for (var key in schema.paths) {
    if (!schema.paths.hasOwnProperty (key) || key === '__v')
      continue;

    var fullKey = pathPrefix + key;
    validation[fullKey] = makeValidationSchemaForPath (schema.paths[key]);
  }

  return validation;
}
