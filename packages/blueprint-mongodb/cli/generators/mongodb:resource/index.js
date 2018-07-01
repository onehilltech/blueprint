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

const { EntityGenerator } = require ('@onehilltech/blueprint-cli-exts');
const pluralize = require ('pluralize');
const path = require ('path');

module.exports = EntityGenerator.extend ({
  description: 'generate a mongodb resource',

  options: {
    '--collection <name>': 'name of the collection',
    '--route <path>': 'access route for the resource (default=/[plural-name])',
    '--soft-delete': 'enable support for soft deleting resource'
  },

  helpers: {
    entityBaseName () {
      let parts = this.args[0].split (path.sep);
      return parts[parts.length - 1];
    },

    referenceName () {
      return this.args[0].replace (path.sep, '.');
    },

    resourcePath () {
      if (this.route)
        return this.route;

      let parts = this.args[0].split (path.sep);
      let baseName = parts[parts.length - 1];

      return `/${pluralize (baseName)}`;
    }
  }
});
