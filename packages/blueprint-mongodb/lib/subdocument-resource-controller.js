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

const { NotFoundError } = require ('@onehilltech/blueprint');
const ResourceController = require ('./resource-controller');
const validation = require ('./validation');
const pluralize = require ('pluralize');
const { extend, camelCase, mapKeys, get } = require ('lodash');

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
    this._super.call (this, Object.assign ({
      name: pluralize.singular (this.path)
    }, opts));

    const { modelName } = this.Model;
    this.parentId = `${camelCase (modelName)}Id`;
  },

  create () {
    const {validators, sanitizers} = this.app.resources;
    const schema = validation (this.Model.schema.paths[this.path].schema, extend ({}, this._defaultValidationOptions, {validators, sanitizers}))

    return this._super.call (this, { schema }).extend ({
      async createModel (req, document) {
        const { Model, path } = this.controller;
        const { modelName } = Model;

        // Get the id for the parent so we can locate the parent.
        const parentId = this.controller.getParentId (req);
        const parentModel = await Model.findById (parentId);

        if (!parentModel)
          throw new NotFoundError ('not_found', `The ${modelName} with id ${modelId} does not exist.`);

        // Create the new student, and mark the subdocument as modified. We can
        // then save the document to the database.
        const model = parentModel[path].create (document);
        parentModel[path].push (model);

        await parentModel.save ();
        return model;
      }
    });
  },

  getParentId (req) {
    return req.params[this.parentId];
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
    return this._super.call (this, ...arguments).extend ({
      getModel (req, id, projection, options) {
        const {Model, path} = this.controller;
        const condition = {[`${path}._id`]: id};

        return Model.findOne (condition, projection, options).then (model => !!model ? model[path].id (id) : null);
      }
    });
  },

  /**
   * Update a single resource in the collection. The id of the target resource to update
   * is expected in the request parameters under `[:resourceId]`.
   *
   * @returns {*}
   */
  update () {
    return this._super.call (this, ...arguments).extend ({
      async updateModel (req, id, update, options) {
        const { path, Model } = this.controller;
        const condition = { [`${path}._id`]: id};

        if (update.$set)
          update.$set = mapKeys (update.$set, (value, key) => `${path}.$.${key}`);

        if (update.$unset)
          update.$unset = mapKeys (update.$unset, (value, key) => `${path}.$.${key}`)

        // Locate the subdocument in the parent model. If there is no model, then
        // we need to let the client know.
        const model = await Model.findOneAndUpdate (condition, update, options);
        return !!model ? get (model, path).id (id) : null;
      }
    })
  },

  /**
   * Delete a single resource from the collection. The id of the target resource
   * to delete is expected in the request parameters under `[:resourceId]`.
   */
  delete () {
    return this._super.call (this, ...arguments).extend ({
      async deleteModel (req, id) {
        const { path, Model } = this.controller;
        const condition = { [`${path}._id`]: id};

        // Locate the subdocument in the parent model. If there is no model, then
        // we need to let the client know.
        const model = await Model.findOne (condition);

        if (!model)
          return Promise.reject (new NotFoundError ('not_found', 'Not found'));

        // Remove the subdocument from the model.
        get (model, path).id (id).remove ();

        return model.save ();
      },
    });
  },

  /**
   * Return the number of resources.
   */
  count () {
    return this._super.call (this, ...arguments);
  },

  /**
   * Search for resources that match the search criteria.
   */
  search () {
    return this._super.call (this, ...arguments);
  }
});
