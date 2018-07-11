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

module.exports = function (path) {
  let schema = { };

  const {enum:enums, match} = path.options;

  if (!!enums) {
    // The path is an enumeration. We can convert this to a isIn() check
    // to constrain the set of accepted strings.
    schema.isIn = {
      options: [enums],
      errorMessage: `${path} must be in ${util.inspect (enums)}`
    }
  }

  if (!!match) {
    schema.matches = {
      options: [match],
      errorMessage: `${path} must match ${match}`
    };
  }

  return schema;
};

