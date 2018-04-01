const pluralize = require ('pluralize');
const Populate  = require ('./populate');

module.exports = Populate.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._plural = pluralize (this.Model.modelName);
  },

  populate (ids) {
    return this.Model.find ({_id: {$in: ids}});
  },

  accept (v) {
    v.visitPopulateArray (this);
  },

  /**
   * Merge a single model onto the population. We do not check if the
   * model is already part of the population.
   *
   * @param model
   * @param population
   */
  addToPopulation (population, models) {
    population.addModels (this._plural, models);
  },

  saveUnseenIds (ids, population) {
    return population.saveUnseenIds (this._plural, ids);
  }
});
