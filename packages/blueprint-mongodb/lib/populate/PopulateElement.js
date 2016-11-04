'use strict'

module.exports = PopulateElement;

function PopulateElement (Model) {
  this._Model = Model;
}

PopulateElement.prototype.populate = function (_id, callback) {
  this._Model.findById (_id, callback);
};

function populateElement (Model, _id, callback) {
  Model.findById (_id, callback);
}
