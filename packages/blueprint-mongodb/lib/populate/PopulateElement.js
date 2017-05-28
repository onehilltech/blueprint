'use strict';

const pluralize = require ('pluralize')
  ;

function PopulateElement (Model) {
  this._Model = Model;
  this._plural = pluralize (this._Model.modelName);
}

module.exports = PopulateElement;

PopulateElement.prototype.makePopulator = function () {
  return new Populator (this._Model);
};

PopulateElement.prototype.populate = function (id, callback) {
  this._Model.findById (id, {__v: 0}, callback);
};

PopulateElement.prototype.__defineGetter__ ('Model', function () {
  return this._Model;
});

PopulateElement.prototype.__defineGetter__ ('plural', function () {
  return this._plural;
});

PopulateElement.prototype.getUnseenIds = function (value, ids, callback) {
  if (!ids[this._plural])
    ids[this._plural] = [];

  const idStr = value.toString ();
  const coll = ids[this._plural];

  if (coll.indexOf (idStr) !== -1)
    return callback (null, null);

  coll.push (idStr);

  return callback (null, value);
};

PopulateElement.prototype.merge = function (value, population, callback) {
  if (!population[this._plural])
    population[this._plural] = [];

  population[this._plural].push (value);
  return callback (null);
};


PopulateElement.prototype.accept = function (visitor) {
  visitor.visitPopulateElement (this);
};
