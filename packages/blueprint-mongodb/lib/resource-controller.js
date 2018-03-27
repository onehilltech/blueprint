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

const DateUtils  = require ('./date-utils');

let validationSchema = require ('./ValidationSchema');
let populate = require ('./populate');

const LAST_MODIFIED = 'Last-Modified';

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

    return Action.extend ({
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
    return Action.extend ({
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
   * Get a single resource from the collection.
   *
   * @returns {*}
   */
  getOne () {
    return Action.extend ({
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
   * Delete a single resource from the collection.
   */
  delete () {
    const eventName = this._computeEventName ('deleted');

    return Action.extend ({
      execute (req, res) {
        const id = req.params[this.controller.id];

        return Promise.resolve (this.preDeleteModel (req))
          .then (() => this.deleteModel (id))
          .then (model => {
            if (!model)
              return Promise.reject (new HttpError (404, 'not_found', 'Not found'));

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

ResourceController.prototype.update = function (opts) {
  function __onPrepareUpdate (req, update, callback) { return callback (null, update); }

  opts = opts || {};
  let on = opts.on || {};

  let idValidationSchema = this._getIdValidationSchema (opts);
  let idSanitizer = this._getIdSanitizer (opts);

  let validate = opts.validate || __validate;
  let sanitize = opts.sanitize || __sanitize;

  let onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  let onPrepareUpdate = on.prepareUpdate || __onPrepareUpdate;
  let onPrepareOptions = on.prepareOptions || __onPrepareOptions;
  let onPreExecute = on.preExecute || __onPreExecute;
  let onPostExecute = on.postExecute || __onPostExecute;
  let onPrepareResponse = on.prepareResponse || __onPrepareResponse;

  let eventName = this._computeEventName ('updated');

  let self = this;

  return {
    validate: function (req, callback) {
      req.check (idValidationSchema);
      req.check (self._update.schema);

      validate.call (null, req, callback);
    },

    sanitize: function (req, callback) {
      async.series ([
        function (callback) {
          if (idSanitizer) {
            if (_.isFunction (idSanitizer))
              return idSanitizer.call (null, req, callback);

            req.sanitizeParams (self.id)[idSanitizer]();
          }

          return callback (null);
        },

        function (callback) {
          sanitize.call (null, req, callback);
        }
      ], callback);
    },

    execute: function __blueprint_update_execute (req, res, callback) {
      let rcId = req.params[self.id];
      let filter = {_id: rcId};


      let update = self._getUpdateFromBody (req.body[self.name]);
      let options = { upsert: false, new: true };

      async.waterfall ([
        function (callback) {
          async.parallel ({
            filter: function (callback) { onPrepareFilter (req, filter, callback); },
            update: function (callback) { onPrepareUpdate (req, update, callback); },
            options: function (callback) { onPrepareOptions (req, options, callback); }
          }, callback);
        },

        // Now, let's search our database for the resource in question.
        function (query, callback) {
          async.series ({
            pre: function (callback) {
              onPreExecute (req, callback);
            },

            execute: function (callback) {
              let dbCompletion = makeDbCompletionHandler ('update_failed', 'Failed to update resource', callback);
              self._model.findOneAndUpdate (query.filter, query.update, query.options, dbCompletion);
            }
          }, completion);

          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }
        },

        // Allow the subclass to do any post-execution analysis of the result.
        function (result, callback) {
          messaging.emit (eventName, result);

          // Set the headers for the response.
          res.set (LAST_MODIFIED, result.getLastModified ().toUTCString ());

          onPostExecute (req, result, callback);
        },

        // Rewrite the result in JSON API format.
        function (data, callback) {
          let result = { };
          result[self.name] = data;

          return callback (null, result);
        },

        function (result, callback) {
          onPrepareResponse (req, result, callback);
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

ResourceController.prototype.delete = function (opts) {
  opts = opts || {};
  let on = opts.on || {};

  let idValidationSchema = this._getIdValidationSchema (opts);
  let idSanitizer = this._getIdSanitizer (opts);

  let validate = opts.validate || __validate;
  let sanitize = opts.sanitize || __sanitize;

  let onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  let onPreExecute = on.preExecute || __onPreExecute;
  let onPostExecute = on.postExecute || __onPostExecute;
  let eventName = this._computeEventName ('deleted');

  let self = this;

  return {
    validate: function (req, callback) {
      req.check (idValidationSchema);
      validate.call (null, req, callback);
    },

    sanitize: function (req, callback) {
      async.series ([
        function (callback) {
          if (idSanitizer) {
            if (_.isFunction (idSanitizer))
              return idSanitizer.call (null, req, callback);

            req.sanitizeParams (self.id)[idSanitizer]();
          }

          return callback (null);
        },

        function (callback) {
          sanitize.call (null, req, callback);
        }
      ], callback);
    },

    execute: function __blueprint_delete (req, res, callback) {
      let rcId = req.params[self.id];
      let filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        function (callback) {
          return onPrepareFilter (req, filter, callback)
        },

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }

          async.series ({
            pre: function (callback) {
              onPreExecute (req, callback);
            },

            execute: function (callback) {
              let dbCompletion = makeDbCompletionHandler ('delete_failed', 'Failed to delete resource', callback);
              self._model.findOneAndRemove (filter, dbCompletion);
            }
          }, completion);
        },

        // Allow the subclass to do any post-execution analysis of the result.
        function (result, callback) {
          // Emit that a resource was created.
          messaging.emit (eventName, result);

          onPostExecute (req, result, callback);
        },

        // Make sure we return 'true'.
        function (result, callback) {
          return callback (null, true);
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

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