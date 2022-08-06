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

const pluralize = require ('pluralize');
const assert = require ('assert');

const { extend, forOwn, isEmpty } = require ('lodash');

const blueprint = require ('@onehilltech/blueprint');

const {
  Action,
  ResourceController,
  HttpError,
  InternalServerError,
  computed,
  NotFoundError
} = blueprint;

const validation = require ('./validation');
const populateHelper = require ('./populate');

const LAST_MODIFIED = 'Last-Modified';

/**
 * Create the schema for validating the resource id.
 *
 * @param location
 */
function createResourceIdSchema (location = 'params') {
  return {
    in: location,
    errorMessage: 'The id is not valid.',
    custom: {
      options: blueprint.lookup ('validator:isMongoId')
    },
    customSanitizer: {
      options: blueprint.lookup ('sanitizer:toMongoId')
    }
  };
}

/**
 * @class DatabaseAction
 *
 * The base class for all database actions. It includes several helper methods
 * that are needed across all database actions.
 */
const DatabaseAction = Action.extend ({
  /**
   * Translate an error code from MongoDB to an HttpError.
   *
   * @param err       Original error object
   * @returns {Promise<never>}
   */
  translateErrorToHttpError (err) {
    if (err.code === 11000) {
      // We are creating a duplicate object. Translate the error to an
      // HttpError object.
      return Promise.reject (new HttpError (400, 'already_exists', 'The resource you are creating already exists.'))
    }
    else {
      return Promise.reject (err);
    }
  },

  /**
   * Emit a event to the application.
   */
  emit () {
    return this.controller.app.emit (...arguments);
  }
});

/**
 * @class ResourceController
 *
 * Resource controller designed to operate on a Mongoose model.
 */
exports = module.exports = ResourceController.extend ({
  /// Custom actions available only to the MongoDB resource controller.
  _actions: {
    search: {verb: 'post', path: '/search', method: 'search'},
  },

  /// Compute the plural name for the resource.
  plural: computed ({
    get () { return pluralize (this.name); }
  }),

  /**
   * @class SingleResourceAction
   *
   * Base class for an action that applies to a single resource. The resource id
   * is expected to be located at req.params[id].
   */
  SingleResourceAction: computed ({
    get () {
      return Action.extend ({
        schema: {
          [this.id]: {
            in: 'params',
            custom: {
              options: blueprint.lookup ('validator:isMongoId')
            },
            customSanitizer: {
              options: blueprint.lookup ('sanitizer:toMongoId')
            }
          }
        },

        /**
         * Default implementation of the execute method.
         *
         * @param req
         * @param res
         * @returns {Promise<*>}
         */
        async execute (req, res) {
          const { Model, id } = this.controller;
          const rcId = req.params[id];

          // Lookup the registration by the provided id.
          const model = await Model.findById (rcId);

          if (!model)
            throw new NotFoundError ('not_found', 'The registration does not exist.');

          return this.executeFor (model, req, res);
        },

        /**
         * Run the execute for the specified model. The model is the one that matches
         * the parameter id.
         *
         * @param model
         * @param req
         * @param res
         */
        executeFor (model, req, res) {

        }
      })
    }
  }),

  /**
   * Initialize the resource controller.
   */
  init (opts = {}) {
    if (!this.Model)
      return;

    const {modelName} = this.Model;

    if (!opts.name)
      opts.name = modelName;

    // Pass control to the base class.
    this._super.call (this, opts);

    // Prepare the options for the base class.
    assert (!!this.Model, "You must define the {Model} property.");

    const { schema: { options: { resource, softDelete}}} = this.Model;

    assert (resource, `${modelName} is not a resource; model must be created using resource() method.`);

    this._softDelete = softDelete;

    // Build the validation schema for create and update.
    this._defaultValidationOptions = {scope: this.name};
  },

  /**
   * Create a new resource.
   */
  create (opts = {}) {
    const eventName = this._computeEventName ('created');
    const { validators, sanitizers } = this.app.resources;

    return DatabaseAction.extend ({
      schema: opts.schema || validation (this.Model.schema, extend ({}, this._defaultValidationOptions, {validators, sanitizers})),

      /// Name of event for completion of action.
      eventName,

      execute (req, res) {
        const name = this.controller.name;
        const document = req.body[name];

        // First, we are going to allow the user to make any preparations needed to
        // the document. This can include adding, removing, and editing fields in the
        // original document.

        return Promise.resolve (this.prepareDocument (req, document))
          .then (document => {
            // The document is prepare for insertion. Allow the subclass to perform
            // any task before we insert the document into the database. After we
            // insert the document, allow the client to make any modifications to the
            // the inserted document.
            return Promise.resolve (this.preCreateModel (req, document))
              .then (() => this.createModel (req, document))
              .catch (this.translateErrorToHttpError.bind (this))
              .then (result => this.postCreateModel (req, result))
              .then (result => {
                if (!result)
                  return Promise.reject (new InternalServerError ('internal_error', 'postCreateModel() should return a result'));

                let { last_modified } = result;

                // Set the headers for the response. We want to make sure that we support
                // the caching headers even if they are not being used.
                if (!!last_modified)
                  res.set (LAST_MODIFIED, last_modified.toUTCString ());

                // Emit that the resource has been created. We do it after the post create
                // method just in case the subclass makes some edits to the model that was
                // just created.
                return this.emit (eventName, result).then (() => result);
              });
          })
          // Initialize the result with the data. We are now going to give the
          // subclass a chance to add more content to the response.
          .then (data => this.prepareResponse (req, res, { [name]: data }))
          .then (result => res.status (200).json (result));
      },

      prepareDocument (req, doc) {
        return doc;
      },

      preCreateModel (req, doc) {
        return null;
      },

      createModel (req, doc) {
        const Model = this.controller.getModelForDocument (doc);
        return Model.create (doc);
      },

      postCreateModel (req, result) {
        return result;
      },

      prepareResponse (req, res, result) {
        return result;
      }
    });
  },

  /**
   * Get all the resources. The query parameter fields are used to filter the
   * resources by exact match. The `options` query parameter is used to control
   * the behavior/presentation of the query response.
   *
   * this._super.call (this, ...arguments).extend ({
   *
   * });
   */
  getAll () {
    const {validators,sanitizers} = this.app.resources;

    return DatabaseAction.extend ({
      schema: Object.assign (
        validation (this.Model.schema, extend ({}, this._defaultValidationOptions, {allOptional:true, validators, sanitizers, scope: false})),
        {
          '_.limit': {
            in: 'query',
            optional: { options: { nullable: true } },
            isInt: true, toInt: true
          },
          '_.sort.*': {
            in: 'query',
            optional: { options: { nullable: true } },
            isInt: true, toInt: true
          }
        }),

      execute (req, res) {
        let query = Object.assign ({}, req.query || {});
        let options = query._ || {};

        if (query._)
          delete query._;

        // Prepare the filter, projection, and options for the request
        // against the database.

        const preparations = [
          this.getFilter (req, query),
          this.getProjection (req),
          this.getOptions (req, options)
        ];

        return Promise.all (preparations)
          .then (([filter, projection, options]) => {
            return Promise.resolve (this.preGetModels (req))
              .then (() => this.getModels (req, filter, projection, options))
              .then (models => {
                // There was nothing found. This is not the same as having an empty
                // model set returned from the query.
                if (!models)
                  return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

                // We have any empty set.
                if (models.length === 0)
                  return this.postGetModels (req, models);

                // Get the most recent last modified date. This value needs to be returned
                // in the response since it represents when this collection of models was
                // last changed.

                const lastModifiedTime = models.reduce ((acc, next) => {
                  let time = next.last_modified.getTime ();
                  return time > acc ? time : acc;
                }, models[0].last_modified.getTime ());

                res.set ({
                  [LAST_MODIFIED]: new Date (lastModifiedTime).toUTCString ()
                });

                return this.postGetModels (req, models);
              })
              .then (data => {
                if (options.populate) {
                  return Promise.resolve (this.getPopulateOptions (req)).then (options => populateHelper.populateModels (data, options));
                }
                else {
                  return {[this.controller.plural]: data};
                }
              })
              .then (result => {
                // We cannot have an empty result. Let's make sure that we have an
                // empty list for this collection of models.

                if (isEmpty (result))
                  result[this.controller.plural] = [];

                return this.prepareResponse (req, res, result)
              })
              .then (result => res.status (200).json (result));
          });
      },

      getFilter (req, filter) {
        return filter;
      },

      getProjection () {
        return {};
      },

      getOptions (req, options) {
        return options;
      },

      preGetModels (req) {
        return null;
      },

      getModels (req, filter, projection, options) {
        const directives = req.query._ || {};
        const { deleted } = directives;

        if (!deleted && this.controller._softDelete)
          filter['_stat.deleted_at'] = {$exists: false};

        return this.controller.Model.find (filter, projection, options);
      },

      postGetModels (req, models) {
        return models;
      },

      prepareResponse (req, res, result) {
        return result;
      },

      getPopulateOptions (req) {
        return null;
      }
    });
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
    return DatabaseAction.extend ({
      schema: {
        [this.resourceId]: createResourceIdSchema ()
      },

      execute (req, res) {
        // Update the options with those from the query string.
        const id = req.params[this.controller.resourceId];
        const query = req.query || {};
        const options = Object.assign ({}, query._ || {});

        const preparations = [
          this.getId (req, id),
          this.getProjection (req),
          this.getOptions (req, options)
        ];

        return Promise.all (preparations)
          .then (([id, projection, options]) => {
            return Promise.resolve (this.preGetModel (req))
              .then (() => this.getModel (req, id, projection, options))
              .then (model => {
                // There was nothing found. This is not the same as having an empty
                // model set returned from the query.
                if (!model)
                  return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

                // Get the last modified date. This value needs to be returned in the
                // response since it represents when this collection of models was last changed.

                if (model.last_modified)
                  res.set (LAST_MODIFIED, model.last_modified.toUTCString ());

                return this.postGetModel (req, model);
              })
              .then (data => {
                if (options.populate) {
                  return Promise.resolve (this.getPopulateOptions (req)).then (options => populateHelper.populateModel (data, options));
                }
                else {
                  return {[this.controller.name]: data};
                }
              })
              .then (result => this.prepareResponse (req, res, result))
              .then (result => res.status (200).json (result));
          });
      },

      getId (req, id) {
        return id;
      },

      getProjection () {
        return {};
      },

      getOptions (req, options) {
        return options;
      },

      preGetModel () {
        return null;
      },

      getModel (req, id, projection, options) {
        if (this.controller._softDelete) {
          const selection = { _id: id, '_stat.deleted_at': { $exists: false }};
          return this.controller.Model.findOne (selection, projection, options);
        }
        else {
          return this.controller.Model.findById (id, projection, options);
        }
      },

      postGetModel (req, models) {
        return models;
      },

      prepareResponse (req, res, result) {
        return result;
      },

      getPopulateOptions (req) {
        return {};
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
    const defaultOptions = { upsert: false, new: true };
    const eventName = this._computeEventName ('updated');
    const {validators,sanitizers} = this.app.resources;

    return DatabaseAction.extend ({
      schema: extend (
        validation (this.Model.schema, extend ({}, this._defaultValidationOptions, {allOptional:true, validators, sanitizers})),
        {[this.resourceId]: createResourceIdSchema () }),

      eventName,

      /**
       * Execute the action.
       *
       * This is the main entry point for the action.
       *
       * @param req
       * @param res
       * @returns {Promise<*[]>}
       */
      execute (req, res) {
        const id = req.params[this.controller.resourceId];
        let update = this.controller._getUpdateFromBody (req.body[this.controller.name]);

        // Allow the subclass to override the contents in both the update and
        // options variable.
        const preparations = [
          this.getId (req, id),
          this.getUpdate (req, update),
          this.getOptions (req, defaultOptions)
        ];

        return Promise.all (preparations).then (([id, update, options]) => {
          return Promise.resolve (this.preUpdateModel (req))
            .then (() => this.updateModel (req, id, update, options))
            .then (model => {
              if (!model)
                return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

              this.emit (this.eventName, model);

              // Set the headers for the response.
              if (model.last_modified)
                res.set (LAST_MODIFIED, model.last_modified.toUTCString ());

              return this.postUpdateModel (req, model);
            })
            .then (model => this.prepareResponse (req, res, {[this.controller.name]: model}))
            .then (result => res.status (200).json (result));
        });
      },

      getId (req, id) {
        return id;
      },

      /**
       * Get the update values for the resource.
       *
       * @param req
       * @param update
       * @returns {update|Promise}
       */
      getUpdate (req, update) {
        return update;
      },

      /**
       * Get the update options for the request.
       *
       * @param req
       * @param options
       * @returns {options|Promise}
       */
      getOptions (req, options) {
        return options;
      },

      /**
       * Perform an operation before the update.
       *
       * @returns {null|Promise}
       */
      preUpdateModel (req) {
        return null;
      },

      updateModel (req, id, update, options) {
        if (this.controller._softDelete) {
          const selection = { _id: id, '_stat.deleted_at': {$exists: false}};
          return this.controller.Model.findOneAndUpdate (selection, update, options);
        }
        else {
          return this.controller.Model.findByIdAndUpdate (id, update, options);
        }
      },

      /**
       * Perform an operation after the update. This method must return the result
       * model, or a Promise the resolve to the result model.
       *
       * @param req
       * @param model
       * @returns {model|Promise}
       */
      postUpdateModel (req, model) {
        return model;
      },

      /**
       * Update the response before it is sent to the client.
       *
       * @param res
       * @param data
       * @returns {data|Promise}
       */
      prepareResponse (req, res, data) {
        return data;
      }
    });
  },

  /**
   * Delete a single resource from the collection. The id of the target resource
   * to delete is expected in the request parameters under `[:resourceId]`.
   */
  delete () {
    const eventName = this._computeEventName ('deleted');

    return DatabaseAction.extend ({
      schema: {
        [this.resourceId]: createResourceIdSchema ()
      },

      eventName,

      execute (req, res) {
        const id = req.params[this.controller.id];

        return Promise.resolve (this.getId (req, id)).then (id => {
          return Promise.resolve (this.preDeleteModel (req))
            .then (() => this.deleteModel (req, id))
            .then (model => {
              // If there is no model, then we need to let the client know.
              if (!model)
                return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

              // Notify all that are listening that we just deleted an resource
              // from the collection.
              this.emit (this.eventName, model);

              return this.postDeleteModel (req, model);
            })
            .then (model => this.prepareResponse (req, res, model, true))
            .then (result => res.status (200).json (result));
        });
      },

      getId (req, id) {
        return id;
      },

      preDeleteModel (req) {

      },

      deleteModel (req, id) {
        const { purge } = req.query;

        if (!purge && this.controller._softDelete) {
          const selection = {_id: id, '_stat.deleted_at': { $exists: false}};
          const update = {$set: {'_stat.deleted_at': new Date ()}};
          const options = { new: true };

          return this.controller.Model.findOneAndUpdate (selection, update, options);
        }
        else {
          return this.controller.Model.findByIdAndRemove (id);
        }
      },

      postDeleteModel (req, result) {
        return result;
      },

      prepareResponse (req, res, model, result) {
        return result;
      }
    });
  },

  /**
   * Return the number of resources.
   */
  count () {
    const eventName = this._computeEventName ('counted');

    return DatabaseAction.extend ({
      execute (req, res) {
        // Make a copy of the original query since we are going to make changes to it
        // before passing it to the subclass.
        const filter = Object.assign ({}, req.query);

        if (filter._)
          delete filter._;

        return Promise.resolve (this.getFilter (req, filter))
          .then (filter => {
            return Promise.resolve (this.preCountModels (req))
              .then (() => this.getCount (req, filter))
              .then (count => {
                this.emit (eventName, count);
                return this.postCountModels (req, count)
              })
              .then (count => this.prepareResponse (req, res, {count: count}))
              .then (response => res.status (200).json (response));
          });
      },

      getFilter (req, filter) {
        return filter;
      },

      getCount (req, filter) {
        // Get the directives from the request, and delete them from the filter
        // if they exist.
        const options = req.query._ || {};
        const { deleted = false } = options;

        if (!deleted && this.controller._softDelete)
          filter['_stat.deleted_at'] = {$exists: false};

        return this.controller.Model.countDocuments (filter);
      },

      preCountModels () {

      },

      postCountModels (req, count) {
        return count;
      },

      prepareResponse (req, res, response) {
        return response;
      }
    });
  },

  /**
   * Search for resources that match the search criteria.
   */
  search () {
    return DatabaseAction.extend ({
      schema: {
        'search.query': {
          in: 'body'
        },

        'search.options': {
          in: 'body',
          optional: true,
        },

        'search._': {
          in: 'body',
          optional: true
        }
      },

      execute (req, res) {
        // Make aa copy of the original search. This way, we can change the search
        // object without changing it within the request.
        const { search } = req.body;

        let query = Object.assign ({}, search.query);
        let options = Object.assign ({}, search.options);

        const directives = search._ || {};

        // Prepare the filter, projection, and options for the request
        // against the database.

        const preparations = [
          this.getQuery (req, query),
          this.getProjection (req),
          this.getOptions (req, options)
        ];

        return Promise.all (preparations)
          .then (([query, projection, options]) => {
            return Promise.resolve (this.preGetModels (req))
              .then (() => this.getModels (req, query, projection, options, directives))
              .then (models => {
                // There was nothing found. This is not the same as having an empty
                // model set returned from the query.
                if (!models)
                  return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

                // We have any empty set.
                if (models.length === 0)
                  return this.postGetModels (req, models);

                // Get the most recent last modified date. This value needs to be returned
                // in the response since it represents when this collection of models was
                // last changed.

                const lastModifiedTime = models.reduce ((acc, next) => {
                  let time = next.last_modified.getTime ();
                  return time > acc ? time : acc;
                }, models[0].last_modified.getTime ());

                res.set ({
                  [LAST_MODIFIED]: new Date (lastModifiedTime).toUTCString ()
                });

                return this.postGetModels (req, models);
              })
              .then (data => {
                if (directives.populate) {
                  return Promise.resolve (this.getPopulateOptions (req)).then (options => populateHelper.populateModels (data, options));
                }
                else {
                  return {[this.controller.plural]: data};
                }
              })
              .then (result => {
                // We cannot have an empty result. Let's make sure that we have an
                // empty list for this collection of models.

                if (isEmpty (result))
                  result[this.controller.plural] = [];

                return this.prepareResponse (req, res, result)
              })
              .then (result => res.status (200).json (result));
          });
      },

      getQuery (req, query) {
        return query;
      },

      getProjection () {
        return {};
      },

      getOptions (req, options) {
        return options;
      },

      preGetModels (/* req */) {
        return null;
      },

      getModels (req, query, projection, options = {}, directives = {}) {
        const { deleted } = directives;

        if (!deleted && this.controller._softDelete)
          query['_stat.deleted_at'] = {$exists: false};

        return this.controller.Model.find (query, projection, options);
      },

      postGetModels (req, models) {
        return models;
      },

      prepareResponse (req, res, result) {
        return result;
      },

      getPopulateOptions (req) {
        return {};
      }
    });
  },

  /**
   * Get the Mongoose model definition for the target. This is important if the
   * document if for an inherited model.
   *
   * @param doc         The document
   * @returns {Model}
   * @private
   */
  getModelForDocument (doc) {
    const {discriminators,schema} = this.Model;

    if (!discriminators)
      return this.Model;

    let discriminatorKey = schema.discriminatorMapping.key;
    let discriminator = doc[discriminatorKey];

    return discriminator ? discriminators[discriminator] : this.Model;
  },

  /**
   * Compute the event name for the resource.
   *
   * @param action
   * @returns {string}
   * @private
   */
  _computeEventName (action) {
    let prefix = this.namespace || '';

    if (prefix.length !== 0)
      prefix += '.';

    return `${prefix}${this.name}.${action}`;
  },

  /**
   * Get the update object from the body.
   *
   * @param body
   * @returns {{}}
   * @private
   */
  _getUpdateFromBody (body) {
    let update = {};

    let $set = {};
    let $unset = {};

    forOwn (body, (value, name) => {
      if (value !== null)
        $set[name] = value;
      else
        $unset[name] = 1;
    });

    // Include the $set and $unset properties only if there are updates
    // associated with either one.
    if (Object.keys ($set).length !== 0)
      update.$set = $set;

    if (Object.keys ($unset).length !== 0)
      update.$unset = $unset;

    return update;
  }
});

exports.DatabaseAction = DatabaseAction;
exports.createResourceIdSchema = createResourceIdSchema;