const {extend}   = require ('lodash');
const {get, has} = require ('object-path');
const validators = require ('./validators');

function makeValidationForSchemaType (schemaType, opts = {}) {
  // Build the general-purpose schema for the path.
  let schema = {};

  // The 'optional' property has to be the first key in the partial schema
  // object in order for validation by schema to work.
  const allOptional = opts.allOptional || false;
  const hasDefault = has (schemaType.options, 'default');
  const validationOptional = get (schemaType.options, 'validation.optional', false);

  if (!schemaType.isRequired || hasDefault || validationOptional || allOptional) {
    // Mark the field as optional. Allow null and undefined values.
    schema.optional = {options: { checkFalsy: true }};
  }
  else if (schemaType.isRequired && !(hasDefault || allOptional)) {
    schema.notEmpty = {
      errorMessage: '%s is required.',
    };
  }

  // Build the instance schema for the path.
  const {instance} = schemaType;
  const validator = validators[instance];

  if (validator) {
    let partialSchema = validator (schemaType);
    schema = extend (schema, partialSchema);
  }

  return schema;
}

function makeValidationSchema (schema, opts = {}) {
  const pathPrefix = opts.pathPrefix ? opts.pathPrefix + '.' : '';

  let validation = {};

  schema.eachPath ((path, schemaType) => {
    const fullKey = `${pathPrefix}${path}`;
    validation[fullKey] = makeValidationForSchemaType (schemaType, {allOptional: opts.allOptional});
  });

  return validation;
}

module.exports = makeValidationSchema;
