const CoreObject = require ('core-object');
const pluralize  = require ('pluralize');
const assert     = require ('assert');
const PopulateVisitor = require ('./populate-visitor');

const {
  differenceWith,
  forOwn,
  flattenDeep,
  mapValues,
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
   * @param saveIds     Save the ids
   */
  addModels (types, models, saveIds = false) {
    let population = this._models[types];

    if (population) {
      population.push (models);

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
  saveUnseenId (type, id) {
    const [unseen] = this.saveUnseenIds (type, [id]);

    return unseen;
  },

  /**
   * Get a list of unseen ids for the given ids.
   *
   * @param type
   * @param ids
   */
  saveUnseenIds (type, ids) {
    const arrOfIds = this._ids[type];
    const unseen = differenceWith (ids, ...arrOfIds, (l, r) => l.equals (r));

    if (unseen.length > 0)
      arrOfIds.push (unseen);

    return unseen;
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
   * @param populators       Target populator.
   * @param data            Data to populate
   * @returns {Promise|null}
   * @private
   */
  _populate (populators, data) {
    if (!data)
      return null;

    let tasks = [];

    forOwn (populators, (populator, path) => {
      const value = data[path];

      if (!value || value.length === 0)
        return;

      // Determine the ids that we need to populate at this point in time. If we
      // have seen all the ids, then there is no need to populate the value(s).
      const unseen = populator.saveUnseenIds (value, this);

      if (!unseen || (unseen.length && unseen.length === 0))
        return;

      const promise = populator.populate (unseen)
        .then (populated => {
          // Add the populated models to our population.
          populator.addToPopulation (this, populated);

          // Now continue down the tree by populating the paths of the new
          // populated model elements.
          const v = new PopulateVisitor ({
            promise: null,
            population: this,

            visitPopulateElement (item) {
              this.promise = this.population.populateElement (item.key, populated);
            },

            visitPopulateArray (item) {
              this.promise = this.population.populateArray (item.key, populated);
            }
          });
          
          populator.accept (v);

          return v.promise;
        });

      tasks.push (promise);
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
