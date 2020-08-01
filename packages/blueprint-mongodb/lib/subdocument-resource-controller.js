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

const ResourceController = require ('./resource-controller');
const assert = require ('assert');

/**
 * @class SubdocumentResourceController
 *
 * Resource controller designed to operate on a Mongoose model.
 */
exports = module.exports = ResourceController.extend ({
  path: null,

  /**
   * Initialize the resource controller.
   */
  init (opts = {}) {
    // Pass control to the base class.
    this._super.call (this, opts);

    // Prepare the options for the base class.
    assert (!!this.path, "You must define the path property.");
  },

  create () {
    return this._super.call (this, ...arguments).extend ({
      createModel (req, document) {

      }
    });
  },

  getAll () {
    return this._super.call (this, ...arguments);
  },

  /**
   * Get a single resource by id from the collection. The id of the target resource
   * is expected in the request parameters under `[:resourceId]`.
   *
   * If you want to query a single resource by fields, then you need to use `getAll`.
   *
   * @returns {*}
   */
  getOne () {
    return this._super.call (this, ...arguments);
  },

  /**
   * Update a single resource in the collection. The id of the target resource to update
   * is expected in the request parameters under `[:resourceId]`.
   *
   * @returns {*}
   */
  update () {
    return this._super.call (this, ...arguments);
  },

  /**
   * Delete a single resource from the collection. The id of the target resource
   * to delete is expected in the request parameters under `[:resourceId]`.
   */
  delete () {
    return this._super.call (this, ...arguments).extend ({
      deleteModel (req, id) {
        const { Model, path } = this.controller;
        const criteria = { [`${path}._id`]: id};

        return Model.findOneAndRemove (criteria);
      },
    });
  },

  /**
   * Search for resources that match the search criteria.
   */
  search () {
    return this._super.call (this, ...arguments);
  }
});
