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
  merge (model, population) {
    let models = population[this._plural];

    if (models)
      models.push (model);
    else
      population[this._plural] = [model];
  },

  /**
   * Get the list of ids that have not been seen.
   *
   * @param value
   * @param ids
   */
  getUnseenIds (value, ids) {
    // Make sure we have a list of ids for this model type.
    if (!ids[this._plural])
      ids[this._plural] = [];

    // Check if the value is included in the list of ids.
    const idStr = value.toString ();
    let coll = ids[this._plural];

    if (coll.includes (idStr))
      return null;

    coll.push (idStr);

    return value;
  },

  accept (v) {
    v.visitPopulateElement (this);
  }
});
