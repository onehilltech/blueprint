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

const { extend, transform, mapValues, get, has } = require ('lodash');

const validators = {
  ObjectID: require ('./objectid'),
  Number: require ('./number'),
  Date: require ('./date'),
  String: require ('./string')
};

/**
 * Build the validation of a single schema type.
 *
 * @param schemaType
 * @param opts
 * @returns {{}}
 */
function buildValidationForSchemaType (schemaType, opts = {}) {
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
    schema.isLength = {
      errorMessage: 'This field is required.',
      options: {min: 1}
    };
  }

  // Add the generic validation before we add the type specific validators
  // to the schema.
  const {validation,sanitization} = schemaType;

  if (validation) {
    const {validator,options,errorMessage} = validation;

    if (validator) {
      if (options || errorMessage) {
        schema[validator] = { };

        if (options) {
          schema[validator].options = options;
        }

        if (errorMessage) {
          schema[validator].errorMessage = errorMessage;
        }
      }
      else {
        schema[validator] = true;
      }
    }
  }

  // Let's add the type specific validator and sanitizer to the schema
  // definition.
  const {instance} = schemaType;
  const validator = validators[instance];

  if (validator) {
    let partialSchema = validator (schemaType);
    schema = extend (schema, partialSchema);
  }

  // Lastly, let's add the generic sanitizer to the schema since we know
  // the type specific validators have already been added.

  if (sanitization) {
    const {sanitizer} = sanitization;

    if (sanitizer)
      schema[sanitizer] = true;
  }

  return schema;
}

function normalize (schema, validators, sanitizers) {
  const validatorNames = Object.keys (validators);
  const sanitizerNames = Object.keys (sanitizers);

  return mapValues (schema, (definition) => {
    return transform (definition, (result, value, key) => {
      if (validatorNames.includes (key)) {
        result.custom = {
          options: validators[key]
        };
      }
      else if (sanitizerNames.includes (key)) {
        result.customSanitizer = {
          options: sanitizers[key]
        }
      }
      else {
        result[key] = value;
      }
    }, {});
  });
}

/**
 * Build the validation schema give the Mongoose schema.
 *
 * @param schema
 * @param opts
 * @returns {{}}
 */
function build (schema, opts = {}) {
  let {scope,validators,sanitizers,allOptional} = opts;

  scope = scope ? `${scope}.` : '';

  let validation = {};

  schema.eachPath ((path, schemaType) => {
    const fullKey = `${scope}${path}`;
    validation[fullKey] = buildValidationForSchemaType (schemaType, {allOptional});
  });

  return normalize (validation, validators, sanitizers);
}

module.exports = build;
