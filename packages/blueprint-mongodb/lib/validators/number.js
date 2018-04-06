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

      const isKind = 'is' + kind;
      schema[isKind] = {
        errorMessage: util.format ('Invalid/missing %s', kind)
      };

      if (validation.options)
        schema[isKind].options = validation.options;
    }
  }

  return schema;
};
