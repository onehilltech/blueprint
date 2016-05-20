var util  = require ('util')
  , async = require ('async')
  ;

var BaseController = require ('./BaseController')
  , HttpError      = require ('./errors/HttpError')
  ;

function __onValidate (req, callback) { return callback (null); }
function __onUpdateFilter (filter, callback) { return callback (null, filter); }
function __onPostExecute (result, callback) { return callback (null, result); }

function makeValidateId (id, next) {
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

/**
 * @class ResourceController
 *
 * Base class for all resource controllers.
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
 * @returns {{validate: (*|__onValidate), execute: __blueprint_getall_execute}}
 */
ResourceController.prototype.getAll = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onValidate = on.validate || __onValidate;
  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onValidate method.
    validate: onValidate,

    execute: function __blueprint_getall_execute (req, res) {
      var filter = {};

      async.waterfall ([
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) { self._model.find (filter, '-__v', makeDbCompletionHandler (callback)); },

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
 * @returns {{validate: (*|__onValidate), execute: __blueprint_create}}
 */
ResourceController.prototype.create = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onPrepareDocument = on.prepareDocument || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onValidate = on.validate || __onValidate;
  var self = this;

  return {
    // There is no resource id that needs to be validated. So, we can
    // just pass control to the onValidate method.
    validate: onValidate,

    execute: function __blueprint_create (req, res) {
      var doc = req.body;

      async.waterfall ([
        async.constant (doc),
        onPrepareDocument,

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
 * @returns {{validate, execute: __blueprint_get_execute}}
 */
ResourceController.prototype.get = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onValidate = on.validate || __onValidate;
  var self = this;

  return {
    validate: makeValidateId (self._id, onValidate),

    execute: function __blueprint_get_execute (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) { self._model.findOne (filter, '-__v', makeDbCompletionHandler (callback)); },

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
 * @returns {{validate, execute: __blueprint_update_execute}}
 */
ResourceController.prototype.update = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onValidate = on.validate || __onValidate;
  var self = this;

  return {
    validate: makeValidateId (self._id, onValidate),

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
          var option = { fields: '-__v', upsert: false, new: true };

          self._model.findOneAndUpdate (filter, update, option, makeDbCompletionHandler (callback));
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
 * @returns {{validate, execute: __blueprint_delete}}
 */
ResourceController.prototype.delete = function (opts) {
  opts = opts || {};
  var on = opts.on || {};

  var onUpdateFilter = on.updateFilter || __onUpdateFilter;
  var onPostExecute = on.postExecute || __onPostExecute;
  var onValidate = on.validate || __onValidate;
  var self = this;

  return {
    validate: makeValidateId (self._id, onValidate),

    execute: function __blueprint_delete (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) { self._model.findOneAndRemove (filter, makeDbCompletionHandler (callback)); },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // Make sure we return 'true'.
        function (result, callback) { return callback (null, true); }
      ], makeTaskCompletionHandler (res));
    }
  };
};

module.exports = exports = ResourceController;
