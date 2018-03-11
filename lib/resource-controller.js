const Controller = require ('./controller');
const HttpError  = require ('./http-error');
const _          = require ('lodash');
const assert     = require ('assert');
const Action     = require ('./action')

const BUILTIN_ACTIONS = {
  // CRUD operations
  create: {verb: 'post', method: 'create'},
  getAll: {verb: 'get', method: 'getAll'},
  getOne: {verb: 'get', path: '/:rcId', method: 'getOne'},
  update: {verb: 'put', path: '/:rcId', method: 'update'},
  delete: {verb: 'delete', path: '/:rcId', method: 'delete'},

  // support operations
  count: {verb: 'get', path: '/count', method: 'count'}
};

const NotFound = Action.extend ({
  execute () {
    return Promise.reject (new HttpError (404, 'not_found', 'Not found'));
  }
});

const ResourceController = Controller.extend ({
  /// Name of the resource managed by the resource controller.
  name: null,

  /// The namespace for the resource controller. The namespace is used to
  /// assist with scoping the resource and preventing collisions with like
  /// named resources.
  namespace: null,

  /// Id for the resource. If the id is not provided, it is generated from
  /// the name of the resource.
  id: null,

  init (opts = {}) {
    this._super.call (this, ...arguments);

    assert (!!opts.name, 'You must provide a \'name\' property.');

    if (!this.id)
      this.id = `${this.name}Id`;

    this._actions = _.merge ({}, BUILTIN_ACTIONS, opts.actions);
  },

  create () {
    return NotFound;
  },

  getAll () {
    return NotFound;
  },

  getOne () {
    return NotFound;
  },

  update () {
    return NotFound;
  },

  delete () {
    return NotFound;
  },

  count () {
    return NotFound;
  }
});

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
