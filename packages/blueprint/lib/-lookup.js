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

const { plural } = require('pluralize');
const { get, isArray, isString } = require ('lodash');

module.exports = function (resources, component) {
  let type, name;

  if (isString (component)) {
    // The component name is a string. This means we need to split the string
    // such that the part before the colon is the type, and the part after the
    // colon is the name.
    [type, name] = component.split (':');
  }
  else if (isArray (component)) {
    // The component name is an array. This means the first item is the type,
    // and remaining values are the name of the resource.
    [type, ...name] = component;
  }
  else {
    throw new Error ('The component must be a String or an Array');
  }

  const types = plural (type);
  const entities = resources[types];

  if (!entities)
    throw new Error (`${type} is not a valid type.`);

  return get (entities, name);
};
