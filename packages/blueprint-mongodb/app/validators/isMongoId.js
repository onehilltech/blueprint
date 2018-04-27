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

const {
  isMongoId
} = require ('validator');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

const {
  isString
} = require ('lodash');

module.exports = function (value) {
  if ((value instanceof ObjectId))
    return true;

  try {
    if (isString (value))
      return isMongoId (value);

    return false;
  }
  catch (err) {
    return false;
  }
};

