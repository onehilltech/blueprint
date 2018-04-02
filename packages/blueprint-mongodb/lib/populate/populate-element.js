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

  accept (v) {
    v.visitPopulateElement (this);
  }
});
