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
  mapValues,
  isEmpty
} = require ('lodash');

const BluebirdPromise = require ('bluebird');
const debug = require ('debug')('blueprint-mongodb:populate:add-model-visitor');

const PopulateVisitor = require ('./populate-visitor');


/**
 * @class AddModelVisitor
 *
 * Visitor responsible for adding populated models to the population.
 */
const AddModelVisitor = PopulateVisitor.extend ({
  promise: null,

  population: null,

  populated: null,

  visitPopulateElement (item) {
    this.population._addModels (item.plural, [this.populated]);
    const populators = this.population.registry.models [item.key];

    if (isEmpty (populators))
      return;

    this.promise = BluebirdPromise.props (mapValues (populators, (populator, key) => {
      debug (`populating ${key}`);
      return this.population._populateElement (populator, this.populated);
    }))
  },

  visitPopulateArray (item) {
    // Add the array of model to our population.
    this.population._addModels (item.plural, this.populated);

    const populators = this.population.registry.models [item.key];

    if (isEmpty (populators))
      return;

    this.promise = BluebirdPromise.props (mapValues (populators, (populator, key) => {
      debug (`populating ${key}`);
      this.promise = this.population._populateArray (populator, this.populated);
    }));
  },

  visitPopulateEmbedded (item) {
    this._addEmbeddedModels (item);
  },

  visitPopulateEmbeddedArray (item) {
    this._addEmbeddedModels (item);
  },

  _addEmbeddedModels (item) {
    let promises = mapValues (item.populators, (populator, name) => {
      let models = this.populated[name];

      let v = new AddModelVisitor ({population: this.population, populated: models});
      populator.accept (v);

      return v.promise;
    });

    this.promise = BluebirdPromise.props (promises);
  }
});

module.exports = AddModelVisitor;
