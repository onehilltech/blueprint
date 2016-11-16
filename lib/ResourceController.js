'use strict';

module.exports = ResourceController;

var BaseController = require ('./BaseController')
  , util           = require ('util')
  ;

function ResourceController (opts) {
  BaseController.call (this, opts);
}

util.inherits (ResourceController, BaseController);

ResourceController.prototype.create = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

ResourceController.prototype.getAll = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

ResourceController.prototype.get = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

ResourceController.prototype.count = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

ResourceController.prototype.update = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

ResourceController.prototype.delete = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

