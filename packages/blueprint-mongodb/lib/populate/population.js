const CoreObject = require ('core-object');
const pluralize  = require ('pluralize');
const assert     = require ('assert');
const PopulateVisitor = require ('./populate-visitor');

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
    this._models = {};

    Object.defineProperty (this, 'models', {
      get () { return this._models; }
    });

    Object.defineProperty (this, 'ids', {
      get () { return this._ids; }
    });

    // Lastly, initialize an empty set of the entire population.
    const modelTypes = this.registry.modelTypes;

    for (let i = 0, len = modelTypes.length; i < len; ++ i) {
      const plural = pluralize (modelTypes[i]);

      this._models[plural] = [];
      this._ids[plural] = [];
    }
  },

  /**
   * Add a collection of models to the population.
   *
   * @param types       Target segment of the population.
   * @param models      Array of models.
   */
  addModels (types, models) {
    let population = this._models[types];

    if (population) {
      // Add the collection of models to the target population.
      population.push (models);

      // Cache the ids of each model for quicker access.
      this._ids[types].push (models.map (model => model._id.toString ()));
    }
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
      populate.accept ({
        _ids: this._ids,

        visitPopulateElement (model) {
          // Make sure we have a list of ids for this model type.
          if (!this._ids[this._plural])
            this._ids[this._plural] = [];

          // Check if the value is included in the list of ids.
          const idStr = value.toString ();
          let coll = ids[this._plural];

          if (coll.includes (idStr))
            return null;

          coll.push (idStr);

          return value;
        },

        visitPopulateArray (arr) {

        }
      });

      const unseenIds = populate.getUnseenIds (value, this._ids);


      if (!unseenIds)
        return;

      const p = populate.populate (unseenIds).then (models => {
        // Merge the models into the population.
        populate.merge (models, this._models);

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
    return mapValues (this._models, values => flattenDeep (values));
  }
});
