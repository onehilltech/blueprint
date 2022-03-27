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

const { transform, isEmpty, get } = require ('lodash');
const PopulateVisitor = require ('./populate-visitor');

/**
 * @class UnseenIdVisitor
 *
 * Visitor that collects the unseen ids for references in the model.
 */
const UnseenIdVisitor = PopulateVisitor.extend ({
  unseen: null,
  population: null,
  value: null,

  visitPopulateElement ({plural}) {
    this.unseen = this.population._saveUnseenIds (plural, [this.value]);
  },

  visitPopulateArray ({plural}) {
    this.unseen = this.population._saveUnseenIds (plural, this.value);
  },

  visitPopulateEmbedded (item) {
    this.unseen = transform (item.populators, (result, populator, name) => {
      let value = get (this.value, name);
      let v = new UnseenIdVisitor ({population: this.population, value});

      populator.accept (v);

      let {plural} = populator;

      if (result[plural])
        result[plural].push (v.unseen);
      else
        result[plural] = [v.unseen];
    }, {});
  },

  visitPopulateEmbeddedArray (item) {
    this.unseen = transform (item.populators, (result, populator, name) => {
      // The value is an array of embedded documents. We need to iterate over the
      // array and determine what what ids for this property (name) does not appear
      // in the current population.

      let ids = this.value.reduce ((result, doc) => {
        let value = doc[name];

        if (value === null)
          return;

        // Lookup the ids that have not been seen.
        let v = new UnseenIdVisitor ({population: this.population, value});
        populator.accept (v);

        // Push the unseen ids to the result.
        if (!isEmpty (v.unseen))
          result.push (v.unseen);

        return result;
      }, []);

      // Add the unseen ids to the results set under the models for the
      // current populator.
      if (!isEmpty (ids)) {
        let { plural } = populator;
        (result[plural] = result[plural] || []).push (ids);
      }
    }, {});
  }
});

module.exports = UnseenIdVisitor;
