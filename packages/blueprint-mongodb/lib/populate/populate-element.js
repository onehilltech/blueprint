const pluralize = require ('pluralize');
const Populate  = require ('./populate');

/**
 * @class PopulateElement
 *
 * Strategy for populating a single model element.
 */
module.exports = Populate.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._plural = pluralize (this.Model.modelName);

    Object.defineProperty (this, 'plural', {
      get () { return this._plural; }
    });
  },

  /**
   * Populate the model for the given id.
   *
   * @param id
   * @returns {*}
   */
  populate (id) {
    return this.Model.findById (id);
  },

  /**
   * Merge a single model onto the population. We do not check if the
   * model is already part of the population.
   *
   * @param model
   * @param population
   */
  addToPopulation (population, model) {
    population.addModels (this._plural, [model]);
  },

  /**
   * Get the list of ids that have not been seen.
   *
   * @param value
   * @param population
   */
  saveUnseenIds (value, population) {
    return population.saveUnseenId (this._plural, value);
  },

  accept (v) {
    v.visitPopulateElement (this);
  }
});
