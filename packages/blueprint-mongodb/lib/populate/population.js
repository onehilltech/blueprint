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
  BO,
  computed
} = require ('@onehilltech/blueprint');

const AddModelVisitor = require ('./add-model-visitor');
const UnseenIdVisitor = require ('./unseen-id-visitor');

const {
  differenceWith,
  flattenDeep,
  mapValues,
  compact,
  isEmpty,
  get,
} = require ('lodash');

const {
  props
} = require ('bluebird');

/**
 * @class Population
 *
 * Wrapper class for managing the population of expanded objects.
 */
module.exports = BO.extend ({
  models: computed ({
    get () {  return mapValues (this._models, flattenDeep); }
  }),

  ids: computed ({
    get () { return mapValues (this._ids, flattenDeep); }
  }),

  init () {
    this._super.call (this, ...arguments);

    this._ids = {};
    this._models = {};

    // Lastly, initialize an empty set of the entire population.
    this.registry.collectionNames.forEach (collectionName => {
      this._models[collectionName] = [];
      this._ids[collectionName] = [];
    });

    if (!this.options)
      this.options = {};
  },

  /**
   * Add a single model to the population.
   *
   * @param model
   */
  addModel (model) {
    const { collectionName, populators } = this.registry.lookup (model.constructor);
    const unseen = this._saveUnseenId (collectionName, model._id);

    if (!unseen)
      return Promise.resolve (this);

    // Add the single model to the target collection.
    this._addModels (collectionName, [model]);

    if (isEmpty (populators))
      return Promise.resolve (this);

    return this._populate (populators, model).then (() => this);
  },

  /**
   * Add an array of models to the population. We assume that all models
   * are of the same type, or from the same collection.
   *
   * @param models
   */
  addModels (models) {
    // We must iterate over each element in the array just in case the elements
    // in the array are polymorphic.
    return Promise.all (models.map (this.addModel.bind (this))).then (() => this);
  },

  /**
   * Add a collection of models to the population.
   *
   * @param types       Target segment of the population.
   * @param models      Array of models.
   * @param saveIds     Save the ids
   */
  _addModels (types, models, saveIds = false) {
    let collection = this._models[types];

    if (collection) {
      collection.push (models);

      if (saveIds)
        this._ids[types].push (models.map (model => model._id));
    }
  },

  /**
   * Test if the population has seen an id.
   *
   * @param type      Target population segment
   * @param id        Id of interest
   */
  _saveUnseenId (type, id) {
    const [unseen] = this._saveUnseenIds (type, [id]);

    return unseen || null;
  },

  /**
   * Get a list of unseen ids for the given ids.
   *
   * @param type
   * @param ids
   */
  _saveUnseenIds (type, ids) {
    // Remove any undefined ids.
    ids = compact (ids);

    const arrOfIds = this._ids[type];
    const unseen = differenceWith (ids, ...arrOfIds, (l, r) => l.equals (r));

    if (unseen.length > 0)
      arrOfIds.push (unseen);

    return unseen;
  },

  /**
   * Populate a single element.
   *
   * @param populator
   * @param model
   * @return {Promise|null}
   */
  _populateElement (populator, model) {
    let unseen = this._saveUnseenId (populator.plural, model._id);

    if (!unseen)
      return null;

    return this._populate (populator, unseen);
  },

  /**
   * Populate an array of elements.
   *
   * @param populator
   * @param arr
   */
  _populateArray (populator, arr, path) {
    // Iterate over each element in the array, and populate each one. The
    // partial result can be ignored since we are will be adding the populated
    // object directly to the result.

    return Promise.all (arr.map (model => this._populateElement (populator, model)));
  },

  /**
   * Instruct the population to process the id. The id can be a single id, or an array
   * or ids.
   *
   * @param populator
   * @param value
   * @returns {null|*}
   */
  processId (populator, value) {
    if (!value)
      return null;

    // Determine the ids that we need to populate at this point in time. If we
    // have seen all the ids, then there is no need to populate the value(s).

    let saveUnseenIds = new UnseenIdVisitor ({population: this, value});
    populator.accept (saveUnseenIds);

    const {unseen} = saveUnseenIds;

    if (isEmpty (unseen))
      return null;

    const { ignore = [] } = this.options;
    const modelName = populator.modelName;

    if (ignore.includes (modelName))
      return null;

    return populator.populate (unseen).then (populated => {
      // Add the populated models to our population.

      const v = new AddModelVisitor ({population: this, populated});
      populator.accept (v);

      return v.promise;
    });
  },

  /**
   * Use the populator to populate the data.
   *
   * @param populators        Target populator
   * @param data              Data to populate
   * @returns {Promise|null}
   * @private
   */
  _populate (populators, data) {
    if (!data)
      return Promise.resolve (this);

    let mapping = mapValues (populators, (populator, path) => {
      // Get the value at the current path. The value can be either a single element or an
      // array of elements. We only need to continue if something exists.

      const value = get (data, path);

      if ( populator.valueExists (value))
        return this.processId (populator, value);
      else
        return null;
    });

    return props (mapping);
  }
});
