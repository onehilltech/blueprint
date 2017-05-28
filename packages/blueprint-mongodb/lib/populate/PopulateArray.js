'use strict';

const async   = require ('async')
  , pluralize = require ('pluralize')
  ;

function PopulateArray (Model) {
  this._Model = Model;
  this._plural = pluralize (this._Model.modelName);
}

module.exports = PopulateArray;

PopulateArray.prototype.populate = function (ids, callback) {
  this._Model.find ({_id: {$in: ids}}, {__v: 0}, callback);
};

PopulateArray.prototype.__defineGetter__ ('Model', function () {
  return this._Model;
});

PopulateArray.prototype.__defineGetter__ ('plural', function () {
  return this._plural;
});

PopulateArray.prototype.accept = function (visitor) {
  visitor.visitPopulateArray (this);
};

PopulateArray.prototype.getUnseenIds = function (value, ids, callback) {
  if (!ids[this._plural])
    ids[this._plural] = [];

  // The value is an array of ObjectIds. We need to return a list of
  // ObjectIds that have not been seen.
  const coll = ids[this._plural];

  async.filter (value, function (id, callback) {
    const idStr = id.toString ();
    const firstTime = coll.indexOf (idStr) === -1;

    if (firstTime)
      coll.push (idStr);

    return callback (null, firstTime);
  }, complete);

  function complete (err, result) {
    return callback (err, result.length > 0 ? result : null);
  }
};

PopulateArray.prototype.merge = function (value, population, callback) {
  if (population[this._plural])
    population[this._plural].push (value);
  else
    population[this._plural] = value;

  return callback (null);
};
