var util  = require ('util')
  , async = require ('async')
  ;

var BaseController = require ('./BaseController')
  , HttpError      = require ('./errors/HttpError')
  ;

/**
 * Test if the projection is exclusive. An exclusive projection only has to
 * have one key that is false (or 0). Any empty projection is exclusive as well,
 * meaning that all fields will be included.
 *
 * @param projection
 * @returns {*}
 */
function isProjectionExclusive (projection) {
  var keys = Object.keys (projection);

  if (keys.length === 0)
    return true;

  var value = projection[keys[0]];
  return value === false || value === 0;
}

function __onAuthorize (req, callback) { return callback (null); }
function __onPrepareProjection (req, callback) { return callback (null, {}); }
function __onUpdateFilter (filter, callback) { return callback (null, filter); }
function __onPreCreate (req, doc, callback) { return callback (null, doc); }
function __onPostExecute (result, callback) { return callback (null, result); }

function makeAuthorize (id, next) {
  return function __blueprint_validate (req, callback) {
    if (!req[id]) return callback (new HttpError (400, 'Missing resource id'));
    return next (req, callback);
  }
}
/**
 * Make the database completion handler. We have to create a new handler
 * for each execution because we need to bind to a different callback.
 *
 * @param res
 * @returns {Function}
 */
function makeDbCompletionHandler (callback) {
  return function __blueprint_db_execution_complete (err, result) {
    if (err) return callback (new HttpError (400, 'Failed to get resource'));
    if (!result) return callback (new HttpError (404, 'Not Found'));

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
function makeTaskCompletionHandler (res) {
  return function __blueprint_task_complete (err, result) {
    if (err) return res.status (err.statusCode).json ({error: err.message});
    return res.status (200).json (result);
  }
}

function makeOnPreCreateHandler (req, onPreCreate) {
  return function __blueprint_on_prepare_document (doc, callback) {
    return onPreCreate (req, doc, callback);
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
  BaseController.call (this);

  opts = opts || {};

  if (!opts.model)
    throw new Error ('Options must define model property');

  if (!opts.id)
    throw new Error ('Options must define id property');

  this._id = opts.id;
  this._model = opts.model;
}

util.inherits (ResourceController, BaseController);

/**
 * Get a list of the resources, if not all.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.getAll = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;

  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onAuthorize method.
    validate: onAuthorize,

    execute: function __blueprint_getall_execute (req, res) {
      var filter = {};

      async.waterfall ([
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          onPrepareProjection (req, function (err, projection) {
            // Do not include the version field in the projection.
            if (isProjectionExclusive (projection))
              projection.__v = 0;

            self._model.find (filter, projection, makeDbCompletionHandler (callback));
          });
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute
      ], makeTaskCompletionHandler (res));
    }
  };
};

/**
 * Create a new resource.
 *
 * @param opts
 * @returns
 */
ResourceController.prototype.create = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onPreCreate = on.preCreate || __onPreCreate;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;

  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onAuthorize method.
    validate: onAuthorize,

    execute: function __blueprint_create (req, res) {
      var doc = req.body;

      async.waterfall ([
        async.constant (doc),
        makeOnPreCreateHandler (req, onPreCreate),

        // Now, let's search our database for the resource in question.
        function (doc, callback) {
          self._model.create (doc, makeDbCompletionHandler (callback));
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // We only want to return the id.
        function (result, callback) {
          return callback (null, {_id: result.id})
        }
      ], makeTaskCompletionHandler (res));
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

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;

  var self = this;

  return {
    validate: makeAuthorize (self._id, onAuthorize),

    execute: function __blueprint_get_execute (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        function (filter, callback) {
          onPrepareProjection (req, function (err, projection) {
            // Do not include the version field in the projection.
            if (isProjectionExclusive (projection))
              projection.__v = 0;

            self._model.findOne (filter, projection, makeDbCompletionHandler (callback));
          });
        },

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          self._model.findOne (filter, '-__v', makeDbCompletionHandler (callback));
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute
      ], makeTaskCompletionHandler (res));
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
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;
  var onPrepareProjection = on.prepareProjection || __onPrepareProjection;

  var self = this;

  return {
    validate: makeAuthorize (self._id, onAuthorize),

    execute: function __blueprint_update_execute (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          var update = { $set: req.body };
          var option = { upsert: false, new: true };

          onPrepareProjection (req, function (err, projection) {
            // Do not include the version field in the projection.
            option.fields = projection;

            if (isProjectionExclusive (projection))
              option.fields.__v = 0;

            self._model.findOneAndUpdate (filter, update, option, makeDbCompletionHandler (callback));
          });
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute
      ], makeTaskCompletionHandler (res));
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

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onAuthorize = on.authorize || __onAuthorize;
  var self = this;

  return {
    validate: makeAuthorize (self._id, onAuthorize),

    execute: function __blueprint_delete (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          self._model.findOneAndRemove (filter, makeDbCompletionHandler (callback));
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // Make sure we return 'true'.
        function (result, callback) { return callback (null, true); }
      ], makeTaskCompletionHandler (res));
    }
  };
};

module.exports = exports = ResourceController;