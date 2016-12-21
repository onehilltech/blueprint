'use strict';

const BaseController = require ('./BaseController')
  , util = require ('util')
  , _ = require ('underscore')
  ;

function ResourceController (opts) {
  BaseController.call (this, opts);

  if (!opts.name)
    throw new Error ('Options define name property');

  this._name = opts.name;
  this._id = opts.id || (this._name + 'Id');

  const BUILTIN_ACTIONS = {
    // CRUD operations
    create: {verb: 'post', method: 'create'},
    getAll: {verb: 'get', method: 'getAll'},
    getOne: {verb: 'get', path: '/:rcId', method: 'get'},
    update: {verb: 'put', path: '/:rcId', method: 'update'},
    delete: {verb: 'delete', path: '/:rcId', method: 'delete'},

    // support operations
    count: {verb: 'get', path: '/count', method: 'count'},

    outdated: [
      {verb: 'get', path: '/outdated', method: 'allOutdated'},
      {verb: 'get', path: '/:rcId/outdated', method: 'outdated'}
    ]
  };

  this._actions = _.extend (BUILTIN_ACTIONS, opts.actions || {});
}

/**
 * Get the resource identifier.
 */
ResourceController.prototype.__defineGetter__ ('name', function () {
  return this._name;
});

/**
 * Get the resource identifier.
 */
ResourceController.prototype.__defineGetter__ ('resourceId', function () {
  return this._id;
});

/**
 * Get the actions supported by the resource controller.
 */
ResourceController.prototype.__defineGetter__ ('actions', function (){
  return this._actions;
});

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
ResourceController.prototype.outdated = util.deprecate (notFound, '/outdated: Use HEAD and Last-Modified HTTP headers');
ResourceController.prototype.allOutdated = util.deprecate (notFound, '/:rcId/outdated: Use HEAD and Last-Modified HTTP headers');
