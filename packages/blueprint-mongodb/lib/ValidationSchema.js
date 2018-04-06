/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
