'use strict';

module.exports = PopulateElement;

function PopulateElement (Model) {
  this._Model = Model;
}

PopulateElement.prototype.makePopulator = function () {
  return new Populator (this._Model);
};

PopulateElement.prototype.populate = function (id, callback) {
  this._Model.findById (id, {__v: 0}, callback);
};

PopulateElement.prototype.__defineGetter__ ('Model', function () {
  return this._Model;
});

PopulateElement.prototype.accept = function (visitor) {
  visitor.visitPopulateElement (this);
};
