/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const assert = require ('assert');
const { computed } = require ('base-object');
const { camelCase } = require ('lodash');

const Action     = require ('./action');
const Controller = require ('./controller');
const NotFoundError  = require ('./not-found-error');

/**
 * @class NotFound
 */
const NotFound = Action.extend ({
  execute () {
    return Promise.reject (new NotFoundError ('not_found', 'Not found'));
  }
});

/**
 * @class ResourceController
 *
 * The base class for all resource controllers. The resource controller provide a
 * common interface that defines the expected CRUD operations for a resource:
 *
 * = create
 * = retrieve: getOne, getAll
 * = update
 * = delete
 */
module.exports = Controller.extend ({
  /// Name of the resource managed by the resource controller.
  name: null,

  /// The namespace for the resource controller. The namespace is used to
  /// assist with scoping the resource and preventing collisions with like
  /// named resources.
  namespace: null,

  /// Id for the resource. If the id is not provided, it is generated from
  /// the name of the resource.
  id: null,

  mergedProperties: ['_actions'],

  _actions: {
    // CRUD operations
    create: {verb: 'post', method: 'create'},
    getAll: {verb: 'get', method: 'getAll'},
    getOne: {verb: 'get', path: '/:rcId', method: 'getOne'},
    update: {verb: 'put', path: '/:rcId', method: 'update'},
    delete: {verb: 'delete', path: '/:rcId', method: 'delete'},

    // support operations
    count: {verb: 'get', path: '/count', method: 'count'}
  },

  resourceId: computed ({
    get () { return this.id; }
  }),

  actions: computed ({
    get () { return this._actions; }
  }),

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.name, 'You must provide a \'name\' property.');

    if (!this.id)
      this.id = `${camelCase (this.name)}Id`;
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
