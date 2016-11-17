'use strict';

module.exports = PopulateArray;

function PopulateArray (Model) {
  this._Model = Model;
}

PopulateArray.prototype.populate = function (ids, callback) {
  this._Model.find ({_id: {$in: ids}}, {__v: 0}, callback);
};

PopulateArray.prototype.__defineGetter__ ('Model', function () {
  return this._Model;
});

PopulateArray.prototype.accept = function (visitor) {
  visitor.visitPopulateArray (this);
};
