const util     = require ('util')
  , async      = require ('async')
  , _          = require ('underscore')
  , pluralize  = require ('pluralize')
  , blueprint  = require ('@onehilltech/blueprint')
  , winston    = require ('winston')
  , DateUtils  = require ('./DateUtils')
  , HttpHeader = require ('./HttpHeader')
  ;

var validationSchema = require ('./ValidationSchema');
var populate = require ('./populate');

var BaseController = blueprint.ResourceController
  , HttpError = blueprint.errors.HttpError
  , messaging = blueprint.messaging
  ;

function __onAuthorize (req, callback) { return callback (null); }
function __onPrepareProjection (req, callback) { return callback (null, {}); }
function __onPrepareOptions (req, options, callback) { return callback (null, options); }
function __onPrepareFilter (req, filter, callback) { return callback (null, filter); }
function __onPrepareDocument (req, doc, callback) { return callback (null, doc); }
function __onPreExecute (req, callback) { return callback (null); }
function __onPostExecute (req, result, callback) { return callback (null, result); }

/**
 * Check for the presence of the id parameter.
 *
 * @param id
 * @param next
 * @returns {function(req, callback)}
 */
function checkIdThenAuthorize (id, next) {
  return function __blueprint_checkIdThenAuthorize (req, callback) {
    if (!req.params[id])
      return callback (new HttpError (400, 'invalid_id', 'Missing resource id'));

    return next (req, callback);
  }
}

/**
 * Make the database completion handler. We have to create a new handler
 * for each execution because we need to bind to a different callback.
 *
 * @param callback
 * @returns {Function}
 */
function makeDbCompletionHandler (code, message, callback) {
  return function __blueprint_db_execution_complete (err, result) {
    if (err) return callback (new HttpError (400, code, message));
    if (!result) return callback (new HttpError (404, 'not_found', 'Not Found'));

    return callback (null, result);
  }
}

/**
 * Make the handler that executes after the async.waterfall tasks is complete. We
 * cannot reuse the same method since we have to bind to a different res object
 * for each request.
 *
 * @param res
 * @returns {Function}
 */
function makeTaskCompletionHandler (res, callback) {
  return function __blueprint_task_complete (err, result) {
    if (err) return callback (err);

    res.status (200).json (result);
  }
}

/**
 * @class ResourceController
 *
 * Base class f or all resource controllers.
 *
 * @param opts
 * @constructor
 */
function ResourceController (opts) {
  if (!opts.model)
    throw new Error ('Options must define model property');

  if (!opts.model.schema.options.resource)
    throw new Error (util.format ('%s is not a resource; use the resource () method', opts.model.modelName));

  if (!opts.name)
    opts.name = opts.model.modelName;

  // Pass control to the base class.
  BaseController.call (this, opts);

  this._model = opts.model;
  this._pluralize = pluralize (this._name);
  this._eventPrefix = opts.eventPrefix;

  // Build the validation schema for create and update.
  var validationOpts = {pathPrefix: this._name};
  this._createValidation = validationSchema (opts.model.schema, validationOpts);
  this._updateValidation = validationSchema (opts.model.schema, _.extend (validationOpts, {allOptional: true}));
}

util.inherits (ResourceController, BaseController);

module.exports = ResourceController;

/**
 * Create a new resource.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.create = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onPrepareDocument = on.prepareDocument || __onPrepareDocument;

  var onPreExecute = on.preExecute || __onPreExecute;
  var onPostExecute = on.postExecute || __onPostExecute;

  var onAuthorize = on.authorize || __onAuthorize;
  var eventName = this.computeEventName ('created');

  var self = this;

  return {
    validate: this.checkSchemaThen (self._createValidation, onAuthorize),

    execute: function __blueprint_create (req, res, callback) {
      var doc = req.body[self._name];

      async.waterfall ([
        async.constant (doc),

        function (doc, callback) {
          async.waterfall ([
            // First, remove all elements from the body that are not part of
            // the target model.
            function (callback) {
              return callback (null, doc);
            },

            function (doc, callback) {
              return onPrepareDocument (req, doc, callback);
            }
          ], callback);
        },

        function (doc, callback) {
          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }

          async.series ({
            pre: function (callback) {
              return onPreExecute (req, callback);
            },

            execute: function (callback) {
              // We need to resolve the correct model just in case the schema for this
              // model contains a discriminator.

              var Model = resolveModel (self._model, doc);
              Model.create (doc, makeDbCompletionHandler ('create_failed', 'Failed to create resource', callback));

              function resolveModel (Model, doc) {
                if (!Model.discriminators) return Model;

                var schema = Model.schema;
                var discriminatorKey = schema.discriminatorMapping.key;
                var discriminator = doc[discriminatorKey];

                return discriminator ? Model.discriminators[discriminator] : Model;
              }
            }
          }, completion);
        },

        function (result, callback) {
          // Emit that a resource was created.
          messaging.emit (eventName, result);

          // Set the headers for the response.
          res.set (HttpHeader.LAST_MODIFIED, result.getLastModified ().toUTCString ());

          onPostExecute (req, result, callback);
        },

        function (data, callback) {
          // Prepare the result sent back to the client.
          var result = {};
          result[self._name] = data;

          return callback (null, result);
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  }
};

/**
 * Get a single resource.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.get = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;
  var onPrepareFilter = on.prepareFilter || __onPrepareFilter;

  var onPreExecute = on.preExecute || __onPreExecute;
  var onPostExecute = on.postExecute || __onPostExecute;

  var self = this;

  return {
    validate: checkIdThenAuthorize (self._id, onAuthorize),

    execute: function __blueprint_get_execute (req, res, callback) {
      var rcId = req.params[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        function (callback) {
          async.parallel ({
            filter: function (callback) { onPrepareFilter (req, filter, callback); },
            projection: function (callback) { onPrepareProjection (req, callback); }
          }, callback);
        },

        function (query, callback) {
          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }

          async.series ({
            pre: function (callback) {
              return onPreExecute (req, callback);
            },

            execute: function (callback) {
              var dbCompletion = makeDbCompletionHandler ('retrieve_failed', 'Failed to retrieve resource', callback);
              self._model.findOne (query.filter, query.projection, dbCompletion);
            }
          }, completion);
        },

        function (result, callback) {
          // Set the headers for the response.
          var lastModified = result.getLastModified ();
          res.set (HttpHeader.LAST_MODIFIED, lastModified.toUTCString ());

          // Check for If-Modified-Since header. This will determine if we should continue
          // or not. If this header is present and the document has not been modified since
          // the provided date, we should return delete the result. Ideally, this should
          // be part of the database query. Unfortunately, that approach would not allow
          // us to distinguish between 304 and 404.

          if (req.headers[HttpHeader.lowercase.IF_MODIFIED_SINCE]) {
            var date = Date.parse (req.headers[HttpHeader.lowercase.IF_MODIFIED_SINCE]);

            if (DateUtils.compare (date, lastModified) !== -1)
              return callback (new HttpError (304, 'Not Changed'));
          }

          onPostExecute (req, result, callback);
        },

        function (data, callback) {
          var result = { };
          result[self._name] = data;

          if (!req.query.populate) {
            return callback (null, result);
          }
          else {
            return populate (data, self._model, function (err, details) {
              result = _.extend (result, details);
              return callback (null, result);
            });
          }
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

/**
 * Get a list of the resources, if not all.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.getAll = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;
  var onPrepareOptions = on.prepareOptions || __onPrepareOptions;

  var onPreExecute = on.preExecute || __onPreExecute;
  var onPostExecute = on.postExecute || __onPostExecute;

  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onAuthorize method.
    validate: onAuthorize,

    execute: function __blueprint_getall_execute (req, res, callback) {
      // Update the options with those from the query string.
      var opts = req.query.options || {};
      var options = {};

      if (req.query.options) {
        delete req.query.options;

        if (opts.skip)
          options.skip = opts.skip;

        if (opts.limit)
          options.limit = opts.limit;

        if (opts.sort)
          options.sort = opts.sort;
      }

      async.waterfall ([
        function (callback) {
          // Prepare the different parts of the query.
          async.parallel ({
            filter: function (callback) { onPrepareFilter (req, req.query, callback); },
            projection: function (callback) { onPrepareProjection (req, callback); },
            options: function (callback) { onPrepareOptions (req, options, callback); }
          }, callback);
        },

        // Now, let's search our database for the resource in question.
        function (query, callback) {
          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }

          async.series ({
            pre: function (callback) {
              return onPreExecute (req, callback);
            },
            execute: function (callback) {
              var dbCompletion = makeDbCompletionHandler ('retrieve_failed', 'Failed to retrieve resource', callback);
              self._model.find (query.filter, query.projection, query.options, dbCompletion);
            }
          }, completion);
        },

        /**
         * Perform post execution of the result set.
         *
         * @param result
         * @param callback
         * @returns {*}
         */
        function (result, callback) {
          // If the length is 0, then we always return the result set regardless of
          // Last-Modified been set in the header. The reason being is Last-Modified
          // does not take into account the contents of the list. Just the modification
          // times. Unfortunately, Last-Modified works if there are resources in the
          // list where we can check create/update times.
          //
          // A solution to the problem above is to support ETag.

          if (result.length === 0)
            return onComplete (null, result);

          async.waterfall ([
            /*
             * Process the headers in the original request. This has the pontential to
             * reduce the number of items we return to the client.
             */
            function processHeaders (callback) {
              var tasks = [
                async.constant (result)
              ];

              if (req.headers[HttpHeader.lowercase.IF_MODIFIED_SINCE])
                tasks.push (processIfModifiedSince);

              async.waterfall (tasks, callback);

              /**
               * Gather the items that were updated after the data defined in the
               * 'If-Modified-Since' HTTP header.
               *
               * @param callback
               */
              function processIfModifiedSince (data, callback) {
                var date = Date.parse (req.headers[HttpHeader.lowercase.IF_MODIFIED_SINCE]);

                async.some (data, function (item, callback) {
                  var result = DateUtils.compare (date, item.getLastModified ()) === -1;
                  return callback (null, result);
                }, complete);

                function complete (err, result) {
                  if (err) return callback (err);
                  if (!result) return callback (new HttpError (304, 'Not Changed'));
                  return callback (null, data);
                }
              }
            },

            /**
             * Set the headers on the response based on the retrieved data.
             *
             * @param data
             * @param callback
             * @returns {*}
             */
              function setHeaders (data, callback) {
              if (data.length === 0)
                return callback (null, data);

              // Start by initializing the headers based on the data from the
              // first time. If we have more than one item, then reduce the data
              // to a single value.

              var headers = { };
              headers[HttpHeader.LAST_MODIFIED] = data[0].getLastModified ();

              if (data.length === 1)
                return onReduceComplete (null, headers);

              async.reduce (data.slice (1), headers, function (memo, item, callback) {
                var lastModified = item.getLastModified ();

                if (DateUtils.compare (memo[HttpHeader.LAST_MODIFIED], lastModified) == -1)
                  memo[HttpHeader.LAST_MODIFIED] = lastModified;

                return callback (null, memo);
              }, onReduceComplete);

              function onReduceComplete (err, headers) {
                if (err) return callback (err, null);

                // The Last-Modified header must be in UTC/GMT string format.
                var lastModified = headers[HttpHeader.LAST_MODIFIED];

                if (lastModified && !_.isString (lastModified))
                  headers[HttpHeader.LAST_MODIFIED] = lastModified.toUTCString ();

                res.set (headers);

                return callback (null, data);
              }
            }
          ], onComplete);

          function onComplete (err, data) {
            if (err) return callback (err);
            return onPostExecute (req, data, callback);
          }
        },

        /**
         * Transform the data into the final result set.
         *
         * @param data
         * @param callback
         * @returns {*}
         */
        function transform (data, callback) {
          var result = { };
          result[self._pluralize] = data;

          if (!opts.populate)
            return callback (null, result);

          return populate (data, self._model, function (err, details) {
            result = _.extend (result, details);
            return callback (null, result);
          });
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

/**
 * Update a single resource.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.update = function (opts) {
  function __onPrepareUpdate (req, update, callback) { return callback (null, update); }

  opts = opts || {};
  var on = opts.on || {};

  var onPrepareFilter = on.prepareFilter || __onPrepareFilter;

  var onPreExecute = on.preExecute || __onPreExecute;
  var onPostExecute = on.postExecute || __onPostExecute;

  var onPrepareUpdate = on.prepareUpdate || __onPrepareUpdate;
  var onPrepareOptions = on.prepareOptions || __onPrepareOptions;
  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;

  var eventName = this.computeEventName ('updated');

  var self = this;

  return {
    validate: checkIdThenAuthorize (self._id, this.checkSchemaThen (self._updateValidation, onAuthorize)),

    execute: function __blueprint_update_execute (req, res, callback) {
      var rcId = req.params[self._id];
      var filter = {_id: rcId};

      var update = { $set: req.body[self._name] };
      var options = { upsert: false, new: true };

      async.waterfall ([
        function (callback) {
          async.parallel ({
            filter: function (callback) { onPrepareFilter (req, filter, callback); },
            options: function (callback) { onPrepareOptions (req, options, callback); },
            update: function (callback) { onPrepareUpdate (req, update, callback); },
            projection: function (callback) { onPrepareProjection (req, callback); }
          }, callback);
        },

        // Now, let's search our database for the resource in question.
        function (query, callback) {
          function completion (err, result) {
            if (err) return callback (err);
            return callback (null, result.execute);
          }

          async.series ({
            pre: function (callback) {
              onPreExecute (req, callback);
            },

            execute: function (callback) {
              var options = query.options;
              options.fields = query.projection;

              var dbCompletion = makeDbCompletionHandler ('update_failed', 'Failed to update resource', callback);
              self._model.findOneAndUpdate (query.filter, query.update, options, dbCompletion);
            }
          }, completion);
        },

        // Allow the subclass to do any post-execution analysis of the result.
        function (result, callback) {
          messaging.emit (eventName, result);

          // Set the headers for the response.
          res.set (HttpHeader.LAST_MODIFIED, result.getLastModified ().toUTCString ());

          onPostExecute (req, result, callback);
        },

        // Rewrite the result in JSON API format.
        function (data, callback) {
          var result = { };
          result[self._name] = data;

          return callback (null, result);
        }
      ], makeTaskCompletionHandler (res, callback));
    }
  };
};

/**
 * Delete a single resource.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.delete = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  var onPreExecute = on.preExecute || __onPreExecute;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;
  var eventName = this.computeEventName ('deleted');
  var self = this;

  return {
    validate: checkIdThenAuthorize (self._id, onAuthorize),

    execute: function __blueprint_delete (req, res, callback) {
      var rcId = req.params[self._id];
      var filter = {_id: rcId};

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
              var dbCompletion = makeDbCompletionHandler ('delete_failed', 'Failed to delete resource', callback);
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

/**
 * Count the number of resources.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.count = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareFilter = on.prepareFilter || __onPrepareFilter;
  var onPostExecute = on.postExecute || __onPostExecute;

  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onAuthorize method.
    validate: onAuthorize,

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

ResourceController.prototype.computeEventName = function (action) {
  var prefix = this._eventPrefix || '';

  if (prefix.length !== 0)
    prefix += '.';

  return prefix + this._name + '.' + action;
};
