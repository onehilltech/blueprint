'use strict';

function PopulateElements (populators) {
  this._populators = populators;
}

module.exports = PopulateElements;

PopulateElements.prototype.populate = function (ids, callback) {
  this._Model.find ({_id: {$in: ids}}, {__v: 0}, callback);
};

PopulateElements.prototype.__defineGetter__ ('Model', function () {
  return this._Model;
});

PopulateElements.prototype.accept = function (visitor) {
  visitor.visitPopulateArray (this);
};

