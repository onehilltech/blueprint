const pluralize = require ('pluralize');
const Populate  = require ('./populate');

module.exports = Populate.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._plural = pluralize (this.Model.modelName);

    Object.defineProperty (this, 'plural', {
      get () { return this._plural; }
    });
  },

  populate (ids) {
    return this.Model.find ({_id: {$in: ids}});
  },

  accept (v) {
    v.visitPopulateArray (this);
  }
});
