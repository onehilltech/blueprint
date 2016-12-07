'use strict';

module.exports = ResourceController;

var BaseController = require ('./BaseController')
  , util           = require ('util')
  ;

function ResourceController (opts) {
  BaseController.call (this, opts);
}

util.inherits (ResourceController, BaseController);

function notFound (req, res) {
  res.sendStatus (404);
}

ResourceController.prototype.create = function () { return notFound; };
ResourceController.prototype.getAll = function () { return notFound; };
ResourceController.prototype.get = function () { return notFound; };
ResourceController.prototype.update = function () { return notFound; };
ResourceController.prototype.delete = function () { return notFound; };

// aggregation functions
ResourceController.prototype.count = function () { return notFound; };
ResourceController.prototype.getFirst = function () { return notFound; };
ResourceController.prototype.getLast = function () { return notFound; };
