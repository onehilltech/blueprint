/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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
const { isString, kebabCase } = require ('lodash');

module.exports = decorator (function (target, key, descriptor, params) {
  delete descriptor.writable;
  delete descriptor.initializer;

  let type, options = {};

  switch (params.length) {
    case 0:
      type = kebabCase (key);
      break;

    case 1:
      if (isString (params[0])) {
        type = params[0];
      }
      else {
        type = key;
        options = params[0];
      }
      break;

    case 2:
      [type, options] = params;
      break;

    default:
      throw new Error ('The @actor decorator cannot have more than 2 parameters.');
  }

  let instance;

  descriptor.get = function () {
    if (instance)
      return instance;

    const dfinity = this.app.lookup ('service:dfinity');
    instance = dfinity.createInstance (type, options);

    return instance;
  }

  return descriptor;
});

