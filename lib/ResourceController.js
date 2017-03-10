'use strict';

const BaseController = require ('./BaseController')
  , HttpError        = require ('./errors/HttpError')
  , util             = require ('util')
  , _                = require ('underscore')
  ;

function ResourceController (opts) {
  BaseController.call (this, opts);

  if (!opts.name)
    throw new Error ('Options define name property');

  this.namespace = opts.namespace;
  this.name = opts.name;
  this.id = opts.id || (this.name + 'Id');

  const BUILTIN_ACTIONS = {
    // CRUD operations
    create: {verb: 'post', method: 'create'},
    getAll: {verb: 'get', method: 'getAll'},
    getOne: {verb: 'get', path: '/:rcId', method: 'get'},
    update: {verb: 'put', path: '/:rcId', method: 'update'},
    delete: {verb: 'delete', path: '/:rcId', method: 'delete'},

    // support operations
    count: {verb: 'get', path: '/count', method: 'count'}
  };

  this._actions = _.extend (BUILTIN_ACTIONS, opts.actions || {});
}

/**
 * Get the resource identifier.
 */
ResourceController.prototype.__defineGetter__ ('resourceId', function () {
  return this.id;
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
  return {
    execute: function (req, res, callback) {
      return callback (new HttpError (404, 'not_found', 'Not found'))
    }
  };
}

ResourceController.prototype.create = notFound;
ResourceController.prototype.getAll = notFound;
ResourceController.prototype.get = notFound;
ResourceController.prototype.update = notFound;
ResourceController.prototype.delete = notFound;

// aggregation functions
ResourceController.prototype.count = notFound;
