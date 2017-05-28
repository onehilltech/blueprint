'use strict';

const async   = require ('async')
  , _         = require ('underscore')
  , pluralize = require ('pluralize')
  ;

function Population (populators) {
  this._populators = populators;
  this._ids = {};
  this.population = {};
}

Population.getKeyFromModel = function (model) {
  return model.db.name + ':' + model.modelName;
};

module.exports = Population;

Population.prototype.flatten = function (callback) {
  async.mapValues (this.population, function (values, key, callback) {
    return callback (null, _.flatten (values));
  }, callback);
};

Population.prototype.populateElement = function (key, model, callback) {
  const populator = this._populators[key];

  if (!populator)
    return callback (null);

  this._populate (populator, model, callback);
};

Population.prototype.populateArray = function (key, arr, callback) {
  const populator = this._populators[key];

  if (!populator)
    return callback (null);

  // Iterate over each element in the array, and populate each one. The
  // partial result can be ignored since we are will be adding the populated
  // object directly to the result.
  async.each (arr, function (model, callback) {
    this._populate (populator, model, callback);
  }.bind (this), callback);
};

Population.prototype._populate = function (populator, data, callback) {
  if (!data)
    return callback (null);

  async.eachOf (populator, function (populate, path, callback) {
    const value  = data[path];

    if (!value)
      return callback (null);

    async.waterfall ([
      // Determine the ids that we need to populate at this point in time. If we have seen
      // all the ids, then there is no need to populate the value(s).
      function (callback) {
        populate.getUnseenIds (value, this._ids, callback);
      }.bind (this),

      // Populate populate the remaining values.
      function (unseen, callback) {
        if (!unseen)
          return callback (null);

        async.waterfall ([
          function (callback) {
            populate.populate (unseen, callback);
          },

          function (models, callback) {
            async.series ([
              function (callback) {
                // Merge the populated models with the reset of the population.
                populate.merge (models, this.population, callback);
              }.bind (this),

              function (callback) {
                // Now continue down the tree by populating the paths of the new
                // populated model elements.
                populate.accept ({
                  visitPopulateElement: function (item) {
                    const key = Population.getKeyFromModel (item.Model);
                    this.populateElement (key, models, callback);
                  }.bind (this),

                  visitPopulateArray: function (item) {
                    const key = Population.getKeyFromModel (item.Model);
                    this.populateArray (key, models, callback);
                  }.bind (this),

                  visitPopulateEmbedArray: function () {
                    return callback (null);
                  }
                });
              }.bind (this)
            ], callback);
          }.bind (this)
        ], callback);
      }.bind (this)
    ], callback);
  }.bind (this), callback);
};
