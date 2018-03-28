const CoreObject = require ('core-object');
const pluralize = require ('pluralize');
const assert = require ('assert');

const {
  forOwn,
  flattenDeep,
  mapValues
} = require ('lodash');

/**
 * @class Population
 *
 * Wrapper class for managing the population of expanded objects.
 */
module.exports = CoreObject.extend ({
  init () {
    this._super.call (this, ...arguments);

    this._ids = {};
    this._population = {};
  },

  /**
   * Add a collection of models to the population.
   *
   * @param key       Association key for models.
   * @param models    Array of models.
   */
  addModels (key, models) {
    const plural = pluralize (key);

    // Add the models to the population.
    if (this._population[plural])
      this._population[plural].push (models);
    else
      this._population[plural] = [models];

    // Cache the ids of each model for quicker access.
    let ids = this._ids[plural];

    if (!ids)
      this._ids[plural] = ids = [];

    models.forEach (model => ids.push (model.id));
  },

  /**
   * Populate a single element.
   *
   * @param key
   * @param model
   * @return {Promise|null}
   */
  populateElement (key, model) {
    const populator = this.registry.models[key];
    assert (!!populator, `Failed to locate populator for ${key}`);

    return this._populate (populator, model);
  },

  /**
   * Populate an array of elements.
   *
   * @param key
   * @param arr
   */
  populateArray (key, arr) {
    const populator = this.registry.models[key];
    assert (!!populator, `Failed to locate populator for ${key}`);

    // Iterate over each element in the array, and populate each one. The
    // partial result can be ignored since we are will be adding the populated
    // object directly to the result.

    let tasks = [];

    arr.forEach (model => tasks.push (this._populate (populator, model)));

    return Promise.all (tasks);
  },

  /**
   * Use the populator to populate the data.
   *
   * @param populator       Target populator.
   * @param data            Data to populate
   * @returns {Promise|null}
   * @private
   */
  _populate (populator, data) {
    if (!data)
      return null;

    let tasks = [];

    forOwn (populator, (populate, path) => {
      const value = data[path];

      if (!value)
        return;

      // Determine the ids that we need to populate at this point in time. If we
      // have seen all the ids, then there is no need to populate the value(s).
      const unseenIds = populate.getUnseenIds (value, this._ids);

      if (!unseenIds)
        return;

      const p = populate.populate (unseenIds).then (models => {
        // Merge the models into the population.
        populate.merge (models, this._population);

        // Now continue down the tree by populating the paths of the new
        // populated model elements.
        const v = {
          visitPopulateElement (item) {
            const key = this.registry.getKeyFromModel (item.Model);
            this.p = this.populateElement (key, models);
          },

          visitPopulateArray (item) {
            const key = this.registry.getKeyFromModel (item.Model);
            this.p = this.populateArray (key, models);
          },

          visitPopulateEmbedArray () {
            this.p = null;
          }
        };

        populate.accept (v);

        return v.p;
      });

      tasks.push (p);
    });

    return Promise.all (tasks);
  },

  /**
   * Flatten the entire population.
   */
  flatten () {
    return mapValues (this._population, values => flattenDeep (values));
  }
});
