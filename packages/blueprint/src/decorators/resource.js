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

const decorator = require ('@onehilltech/decorator');
const blueprint = require ('../index');

const { isString, kebabCase } = require ('lodash');

function lookup (target, key, descriptor, params) {
  let [type, name] = params;

  // This is the cached instance of the resource we looked up. This
  // will optimize the cost of having to lookup a new instance.
  let instance;

  // Delete the original initializer, and make this property not writable. Instead, we should
  // only enable get() accessor on the property.

  delete descriptor.initializer;
  delete descriptor.writable;

  descriptor.get = function () {
    if (instance) {
      return instance;
    }

    name = isString (name) ? name : kebabCase (key);
    const lookupName = `${type}:${name}`;
    instance = blueprint.lookup (lookupName);

    return instance;
  }

  return descriptor;
}

/**
 * Implementation of the generic resource decorator.
 *
 */
module.exports = exports = decorator (function resource (target, key, descriptor, params) {
  return lookup (target, key, descriptor, params);
});

/**
 * Define decorator for a specific type of resource.
 *
 * @param type          Resource type
 */
exports.decorator = function (type) {
  return decorator (function (target, key, descriptor, params) {
    return lookup (target, key, descriptor, [type, ...params]);
  });
};

