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

const Generator = require ('./generator');
const path = require ('path');

/**
 * @class EntityGenerator
 *
 * Base class for all entity generators. An entity generator takes a required
 * command line argument, which is the name of the entity.
 */
module.exports = Generator.extend ({
  args: ['<name>'],

  helpers: {
    /**
     * Get the name of the entity.
     *
     * @return {*}
     */
    entityName () {
      return this.args[0];
    },

    /**
     * Get the base name of the entity, if the name includes a path.
     *
     * @return {*}
     */
    entityBaseName () {
      let parts = this.args[0].split (path.sep);
      return parts[parts.length - 1];
    }
  }
});
