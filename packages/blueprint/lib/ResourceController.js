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

function checkIdThenAuthorize (id, next) {
  return function __blueprint_checkIdThenAuthorize (req, callback) {
    if (!req[id])
      return callback (new HttpError (400, 'Missing resource id'));

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

  if (!opts.name)
    throw new Error ('Options must define name property');

  this._id = opts.id;
  this._model = opts.model;
  this._name = opts.name;
}

util.inherits (ResourceController, BaseController);

/**
 * Factory method for creating a check function \a runChecks ().
 *
 * @returns {Function}
 */
ResourceController.check = function () {
  var args = [].slice.call (arguments);
  var check = args.shift ();

  return function __run_check (req, callback) {
    // Push the callback as the last argument.
    args.push (req);
    args.push (callback);

    // Call the check.
    return check.apply (this, args);
  };
};

/**
 * A set of OR checks...
 *
 * @param checks
 * @returns {Function}
 */
ResourceController.orCheck = function (checks) {
  return function __run_orCheck (req, callback) {
    async.some (checks,
      function __orCheck_iterator (check, callback) {
        return check (req, function __orCheck_result (err, result) {
          // Since we are using async 1.5, we need to ignore the err parameter.
          callback (result);
        });
      },
      function __orCheck_complete (result) {
        // This is a callback from our framework. We need to pass in null as
        // the error so we have proper behavior.
        return callback (null, result);
      }
    );
  };
};

/**
 * A set of AND checks...
 *
 * @param checks
 * @returns {Function}
 */
ResourceController.andCheck = function (checks) {
  return function __run_orCheck (req, callback) {
    async.every (checks,
      function __orCheck_iterator (check, callback) {
        return check (req, function __orCheck_result (err, result) {
          // Since we are using async 1.5, we need to ignore the err parameter.
          callback (result);
        });
      },
      function __orCheck_complete (result) {
        // This is a callback from our framework. We need to pass in null as
        // the error so we have proper behavior.
        return callback (null, result);
      }
    );
  };
};

/**
 * Implementation of the authorize handler design to run a unique set of
 * checks to determine if the current request is authorized to access the
 * targeted resource.
 *
 * @param checks
 * @returns {Function}
 */
ResourceController.runChecks = function (checks, req, callback) {
  async.every (checks, __check_iterator (req), __check_complete (callback));

  function __check_result (callback) {
    return function __check_result_impl (err, result) {
      // Since we using async 1.5, we need to ignore the err. When we upgrade to
      // async 2.x, we will take into account the err parameter.)
      return callback (result);
    }
  }

  function __check_iterator (req) {
    return function __check_iterator_impl (check, callback) {
      return check (req, __check_result (callback));
    }
  }

  function __check_complete (callback) {
    return function __check_complete_impl (result) {
      if (!result) return callback (new HttpError (403, 'Unauthorized access'));
      return callback ();
    }
  }
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
        onPostExecute,

        // Rewrite the result in JSON API format.
        function (data, callback) {
          var pluralName = self._name + 's';

          var result = { };
          result[pluralName] = data;

          return callback (null, result);
        }
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
      var doc = req.body[self._name];

      async.waterfall ([
        async.constant (doc),
        makeOnPreCreateHandler (req, onPreCreate),

        // Now, let's search our database for the resource in question.
        function (doc, callback) {
          self._model.create (doc, makeDbCompletionHandler (callback));
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // Serialize the data in REST format.
        function (data, callback) {
          var result = {};
          result[self._name] = data.toJSON ();
          delete result[self._name].__v;

          return callback (null, result);
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
    validate: checkIdThenAuthorize (self._id, onAuthorize),

    execute: function __blueprint_get_execute (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Prepare the projection, and then execute the database command.
        function (filter, callback) {
          onPrepareProjection (req, function (err, projection) {
            // Do not include the version field in the projection.
            if (isProjectionExclusive (projection) && projection['__v'] === undefined)
              projection['__v'] = 0;

            self._model.findOne (filter, projection, makeDbCompletionHandler (callback));
          });
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // Rewrite the result in JSON API format.
        function (data, callback) {
          var result = { };
          result[self._name] = data;

          return callback (null, result);
        }
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
    validate: checkIdThenAuthorize (self._id, onAuthorize),

    execute: function __blueprint_update_execute (req, res) {
      var rcId = req[self._id];
      var filter = {_id: rcId};

      async.waterfall ([
        // First, allow the subclass to update the filter.
        async.constant (filter),
        onUpdateFilter,

        // Now, let's search our database for the resource in question.
        function (filter, callback) {
          var update = { $set: req.body[self._name] };
          var option = { upsert: false, new: true };

          onPrepareProjection (req, function (err, projection) {
            // Do not include the version field in the projection.
            option.fields = projection;

            if (isProjectionExclusive (projection) && projection['__v'] === undefined)
              option.fields.__v = 0;

            self._model.findOneAndUpdate (filter, update, option, makeDbCompletionHandler (callback));
          });
        },

        // Allow the subclass to do any post-execution analysis of the result.
        onPostExecute,

        // Rewrite the result in JSON API format.
        function (data, callback) {
          var result = { };
          result[self._name] = data;

          return callback (null, result);
        }
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
    validate: checkIdThenAuthorize (self._id, onAuthorize),

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
