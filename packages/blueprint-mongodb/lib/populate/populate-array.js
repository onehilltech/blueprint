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
  computed
} = require ('@onehilltech/blueprint');

const pluralize = require ('pluralize');
const Populate  = require ('./populate');

/**
 * @class PopulateArray
 *
 * Strategy for populating an array of elements.
 */
module.exports = Populate.extend ({
  /// The model definition used to populate models.
  Model: null,

  modelName: computed ({
    get () { return this.Model.modelName}
  }),

  plural: computed ({
    get () {
      return pluralize (this.Model.modelName);
    }
  }),

  populate (ids) {
    const { [this.modelName]: options = {}} = (this.options || {});
    return this.Model.find ({_id: {$in: ids}}, options);
  },

  accept (v) {
    v.visitPopulateArray (this);
  },

  valueExists (value) {
    return !!value && value.length > 0;
  }
});
