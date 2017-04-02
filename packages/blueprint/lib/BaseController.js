'use strict';

const async   = require ('async')
  , HttpError = require ('./errors').HttpError
  ;

/**
 * @class BaseController
 * @constructor
 *
 * Base class for all controllers.
 */
function BaseController () {

}

module.exports = BaseController;

/**
 * Check the request against the schema, and then execute the follow-up function
 * if the schema check passes. This function should be used to generate the validate
 * function for a controller action.
 *
 * @param schema
 * @param then
 * @returns {Function}
 */
BaseController.prototype.checkSchemaThen = function (schema, then) {
  return function (req, callback) {
    async.series ([
      function (callback) {
        req.check (schema);
        var errors = req.validationErrors ();
        var err = !errors ? null : new HttpError (400, 'validation_failed', 'Bad request', {validation: errors});

        return callback (err);
      },

      function (callback) {
        then (req, callback);
      }
    ], callback);
  };
};
