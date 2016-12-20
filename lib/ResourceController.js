'use strict';

var BaseController = require ('./BaseController')
  , util = require ('util')
  ;

function ResourceController (opts) {
  BaseController.call (this, opts);
}

module.exports = ResourceController;

util.inherits (ResourceController, BaseController);

function notFound () {
  return function (req, res) {
    res.sendStatus (404);
  }
}

ResourceController.prototype.create = notFound;
ResourceController.prototype.getAll = notFound;
ResourceController.prototype.get = notFound;
ResourceController.prototype.update = notFound;
ResourceController.prototype.delete = notFound;

// aggregation functions
ResourceController.prototype.count = notFound;
ResourceController.prototype.getFirst = notFound;
ResourceController.prototype.getLast = notFound;

// outdated functions
ResourceController.prototype.isOutdated = notFound;
ResourceController.prototype.isAllOutdated = notFound;
