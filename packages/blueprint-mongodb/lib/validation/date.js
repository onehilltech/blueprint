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

const blueprint = require ('@onehilltech/blueprint');
const { extend } = require ('lodash');

module.exports = function (path) {
  let schema = { };

  const validation = path.options.validation;

  if (validation) {
    if (validation.kind && validation.kind === 'Numeric') {
      schema.isNumeric = {
        errorMessage: 'The numeric date is invalid.'
      }
    }
    else {
      schema = extend (schema, {
        custom: {
          options: blueprint.lookup ('validator:isDate'),
          errorMessage: 'The date is invalid.',
        },
        customSanitizer: {
          options: blueprint.lookup ('sanitizer:toDate')
        }
      });
    }
  }
  else {
    // There is no defined validation. We are going to assume the client
    // is uploading a date string.
    schema = extend (schema, {
      custom: {
        options: blueprint.lookup ('validator:isDate'),
        errorMessage: 'The date is invalid.',
      },
      customSanitizer: {
        options: blueprint.lookup ('sanitizer:toDate')
      }
    });
  }

  return schema;
};
