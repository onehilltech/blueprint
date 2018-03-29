const pluralize = require ('pluralize');
const Populate  = require ('./populate');

module.exports = Populate.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._plural = pluralize (this.Model.modelName);
  },

  populate (ids) {
    this.Model.find ({_id: {$in: ids}});
  },

  accept (v) {
    v.visitPopulateArray (this);
  },

  saveUnseenIds (ids, population) {
    return population.saveUnseenIds (this._plural, ids);
  }
});
