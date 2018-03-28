const async     = require ('async')
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

  merge (models, population) {
    if (population[this._plural])
      population[this._plural].push (models);
    else
      population[this._plural] = [models];
  },

  getUnseenIds (values, ids) {
    if (!ids[this._plural])
      ids[this._plural] = [];

    // The value is an array of ObjectIds. We need to return a list of
    // ObjectIds that have not been seen.
    const coll = ids[this._plural];

    const result = values.filter (value, (id) => {
      const idStr = id.toString ();
      const firstTime = coll.indexOf (idStr) === -1;

      if (firstTime)
        coll.push (idStr);

      return firstTime;
    });

    return result.length ? result : null;
  }
});
