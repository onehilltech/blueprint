const {
  extend
} = require ('lodash');

const pluralize  = require ('pluralize');
const assert     = require ('assert');

const {
  Action,
  ResourceController,
  HttpError
} = require ('@onehilltech/blueprint');

let validationSchema = require ('./ValidationSchema');
let populate = require ('./populate');

const LAST_MODIFIED = 'Last-Modified';

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
  }
});

/**
 * @class ResourceController
 *
 * Resource controller designed to operate on a Mongoose model.
 */
module.exports = ResourceController.extend ({
  /**
   * Initialize the resource controller.
   * @param opts
   */
  init () {
    let [opts, ...params] = arguments;

    if (!opts.name)
      opts.name = this.model.modelName;

    // Pass control to the base class.
    this._super.init.call (this, opts, ...params);

    // Prepare the options for the base class.
    assert (!!this.model, "You must define the 'model' property.");
    assert (this.model.schema.options.resource, `${this.model.modelName} is not a resource; model must be created using resource() method`);

    this.plural = pluralize (this.name);
    this._idOpts = opts.idOptions || {};

    // Build the validation schema for create and update.
    let validationOpts = {pathPrefix: this.name};

    this._create = {
      schema: validationSchema (this.model.schema, validationOpts)
    };

    this._update = {
      schema: validationSchema (this.model.schema, extend ({allOptional: true}, validationOpts))
    };
  },

  /**
   * Create a new resource.
   */
  create () {
    const eventName = this._computeEventName ('created');

    return DatabaseAction.extend ({
      /// Name of event for completion of action.
      eventName: null,

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
            return Promise.resolve (this.preCreateModel (req))
              .then (() => this.createModel (document))
              .catch (this.translateErrorToHttpError.bind (this))
              .then (result => {
                // Emit that the resource has been created. We do it after the post create
                // method just in case the subclass makes some edits to the model that was
                // just created.
                this.emit (eventName, result);

                // Set the headers for the response. We want to make sure that we support
                // the caching headers even if they are not being used.
                res.set (LAST_MODIFIED, result.getLastModified ().toUTCString ());

                return this.postCreateModel (req, result);
              });
          })
          .then (data => {

            // Initialize the result with the data. We are now going to give the
            // subclass a chance to add more content to the response.
            const result = { [name]: data };
            return this.prepareResponse (res, result);
          })
          .then (result => {
            res.status (200).json (result);
          });
      },

      prepareDocument (req, doc) {
        return doc;
      },

      preCreateModel () {
        return null;
      },

      createModel (doc) {
        const Model = this.controller.getModelForDocument (doc);
        return Model.create (doc);
      },

      postCreateModel (req, result) {
        return result;
      },

      prepareResponse (res, result) {
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
    return DatabaseAction.extend ({
      execute (req, res) {
        // Update the options with those from the query string.
        const {query} = req;
        const {options} = query;
        let opts = {};

        if (options) {
          // Remove the options from the query object because we do not
          // want them to interfere with the filter parameters.
          delete query.options;

          // Copy over the acceptable options because we do not want to
          // the client to submit invalid/unacceptable options.

          if (options.limit)
            opts.limit = options.limit;

          if (options.skip)
            opts.skip = options.skip;

          if (options.sort)
            opts.sort = options.sort;
        }
        else {
          // There are not options. Let's initialize the options to
          // the default options (i.e., empty options).
          opts = {};
        }

        // Prepare the filter, projection, and options for the request
        // against the database.

        const preparations = [
          this.getFilter (req, query),
          this.getProjection (req),
          this.getOptions (req, opts)
        ];

        return Promise.all (preparations)
          .then (results => {
            return Promise.resolve (this.preGetModels (req))
              .then (() => this.getModels (...results))
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
                  let time = next.getLastModified ().getTime ();
                  return time > acc ? time : acc;
                }, models[0].getLastModified ().getTime ());

                res.set ({
                  [LAST_MODIFIED]: new Date (lastModifiedTime).toUTCString ()
                });

                return this.postGetModels (req, models);
              })
              .then (data => {
                let result = {
                  [this.controller.plural]: data
                };

                if (!opts.populate)
                  return result;

                /*
                return populate (data, self._model, function (err, details) {
                  result = _.extend (result, details);
                  return callback (null, result);
                });
                */
              })
              .then (result => {
                return this.prepareResponse (res, result);
              })
              .then (result => {
                res.status (200).json (result);
              });
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

      getModels (filter, projection, options) {
        return this.controller.model.find (filter, projection, options);
      },

      postGetModels (req, models) {
        return models;
      },

      prepareResponse (res, result) {
        return result;
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
      execute (req, res) {
        // Update the options with those from the query string.
        const id = req.params[this.controller.resourceId];
        const options = req.query.options || {};

        // Prepare the filter, projection, and options for the request
        // against the database.

        const preparations = [
          this.getProjection (req),
          this.getOptions (req, options)
        ];

        return Promise.all (preparations)
          .then (results => {
            return Promise.resolve (this.preGetModel (req))
              .then (() => this.getModel (id, ...results))
              .then (model => {
                // There was nothing found. This is not the same as having an empty
                // model set returned from the query.
                if (!model)
                  return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

                // Get the last modified date. This value needs to be returned in the
                // response since it represents when this collection of models was last changed.

                res.set ({
                  [LAST_MODIFIED]: model.getLastModified ().toUTCString ()
                });

                return this.postGetModel (req, model);
              })
              .then (data => {

                return  {
                  [this.controller.name]: data
                };

                /*
                return populate (data, self._model, function (err, details) {
                  result = _.extend (result, details);
                  return callback (null, result);
                });
                */
              })
              .then (result => {
                return this.prepareResponse (res, result);
              })
              .then (result => {
                res.status (200).json (result);
              });
          });
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

      getModel (rcId, projection, options) {
        return this.controller.model.findById (rcId, projection, options);
      },

      postGetModel (req, models) {
        return models;
      },

      prepareResponse (res, result) {
        return result;
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

    return DatabaseAction.extend ({
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
        const update = req.body[this.controller.name];

        // Allow the subclass to override the contents in both the update and
        // options variable.
        const preparations = [
          this.getUpdate (req, update),
          this.getOptions (req, defaultOptions)
        ];

        return Promise.all (preparations)
          .then (([update, options]) => {
            return Promise.resolve (this.preUpdateModel (req))
              .then (() => this.updateModel (id, update, options))
              .then (model => {
                if (!model)
                  return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

                this.emit (eventName, model);

                // Set the headers for the response.
                res.set (LAST_MODIFIED, model.getLastModified ().toUTCString ());

                return this.postUpdateModel (req, model);
              })
              .then (model => {
                return this.prepareResponse (res, {[this.controller.name]: model})
              })
              .then (result => {
                return res.status (200).json (result);
              });
          });
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
      preUpdateModel () {
        return null;
      },

      updateModel (id, update, options) {
        return this.controller.model.findByIdAndUpdate (id, update, options);
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
      prepareResponse (res, data) {
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
      execute (req, res) {
        const id = req.params[this.controller.id];

        return Promise.resolve (this.preDeleteModel (req))
          .then (() => this.deleteModel (id))
          .then (model => {
            // If there is no model, then we need to let the client know.
            if (!model)
              return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

            // Notify all that are listening that we just deleted an resource
            // from the collection.
            this.emit (eventName, model);

            return this.postDeleteModel (req, model);
          })
          .then (model => this.prepareResponse (res, model, true))
          .then (result => res.status (200).json (result));
      },

      preDeleteModel (req) {

      },

      deleteModel (id) {
        return this.controller.model.findByIdAndRemove (id);
      },

      postDeleteModel (req, result) {
        return result;
      },

      prepareResponse (res, model, response) {
        return response;
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
    const {discriminators,schema} = this.model;

    if (!discriminators)
      return this.model;

    let discriminatorKey = schema.discriminatorMapping.key;
    let discriminator = doc[discriminatorKey];

    return discriminator ? discriminators[discriminator] : this.model;
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
  }
});

/*

ResourceController.prototype.count = function (opts) {
  opts = opts || {};
  let on = opts.on || {};

  let validate = opts.validate || __validate;
  let sanitize = opts.sanitize || __sanitize;

  let onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  let onPostExecute = on.postExecute || __onPostExecute;

  let self = this;

  return {
    validate: validate,
    sanitize: sanitize,

    execute: function __blueprint_count_execute (req, res, callback) {
      async.waterfall ([
        async.constant (req.query),

        function (filter, callback) {
          return onPrepareFilter (req, filter, callback)
        },

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          self._model.count (filter, makeDbCompletionHandler ('count_failed', 'Failed to count resources', callback));
        },

        // Allow the subclass to do any post-execution analysis of the result.
        function (count, callback) { onPostExecute (req, count, callback); },

        // Rewrite the result in JSON API format.
        function (count, callback) {
          return callback (null, {count: count});
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

ResourceController.prototype._getIdValidationSchema = function (opts) {
  let defaults = objectPath (this._idOpts);

  let id = objectPath (opts.id);
  let validator = id.get ('validator', defaults.get ('validator', 'isMongoId'));
  let validatorOptions = id.get ('validatorOptions', defaults.get ('validatorOptions'));
  let errorMessage = id.get ('errorMessage', defaults.get ('errorMessage', 'Invalid resource id'));

  let schema = {};
  schema[this.id] = {
    in: 'params'
  };

  schema[this.id][validator] = {errorMessage: errorMessage};

  if (validatorOptions)
    schema[this.id][validator].options = validatorOptions;

  return schema;
};

ResourceController.prototype._getIdSanitizer = function (opts) {
  let defaults = objectPath (this._idOpts);

  let id = objectPath (opts.id);
  return id.get ('sanitizer', defaults.get ('sanitizer', 'toMongoId'));
};

ResourceController.prototype._getUpdateFromBody = function (body) {
  let update = {};

  let $set = {};
  let $unset = {};

  for (let name in body) {
    if (!body.hasOwnProperty (name) || name === '_id')
      continue;

    let value = body[name];

    if (value !== null)
      $set[name] = value;
    else
      $unset[name] = 1;
  }

  // Include the $set and $unset properties only if there are updates
  // associated with either one.
  if (Object.keys ($set).length !== 0)
    update.$set = $set;

  if (Object.keys ($unset).length !== 0)
    update.$unset = $unset;

  return update;
};

*/