'use strict';

const async = require ('async')
  ;

function PopulateEmbedArray (populate) {
  this._populate = populate;
}

module.exports = PopulateEmbedArray;

PopulateEmbedArray.prototype.populate = function (ids, callback) {
  async.mapValues (ids, function (values, path, callback) {
    var populate = this._populate[path];

    async.map (values, function (value, callback) {
      populate.populate (value, callback);
    }, callback);
  }.bind (this), callback);
};

PopulateEmbedArray.prototype.accept = function (visitor) {
  visitor.visitPopulateEmbedArray (this);
};

PopulateEmbedArray.prototype.getUnseenIds = function (values, ids, callback) {
  var unseen = {};

  function complete (err) {
    return callback (err, unseen);
  }

  async.eachOf (this._populate, function (populate, path, callback) {
    async.each (values, function (value, callback) {
      const data = value[path];

      if (!data)
        return callback (null);

      async.waterfall ([
        function (callback) {
          populate.getUnseenIds (data, ids, callback);
        },

        function (result, callback) {
          if (!result)
            return callback (null);

          if (unseen[path])
            unseen[path].push (result);
          else
            unseen[path] = [result];

          return callback (null);
        }
      ], callback);
    }, callback);
  }, complete);
};

PopulateEmbedArray.prototype.merge = function (values, population, callback) {
  async.eachOf (values, function (value, key, callback) {
    const plural = this._populate[key].plural;

    if (population[plural])
      population[plural].push (value);
    else
      population[plural] = value;

    return callback (null);
  }.bind (this), callback);
};
