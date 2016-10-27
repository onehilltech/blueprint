'use strict';

/**
 * @class BaseController
 * @constructor
 *
 * Base class for all controllers.
 */
function BaseController () {

}

BaseController.prototype.notFound = function () {
  return function (req, res) {
    res.status (404).json ({error: 'Not Found'});
  };
};

BaseController.prototype.checkSchemaThen = function (schema, then) {
  return function (req, callback) {
    async.series ([
      function (callback) {
        req.check (schema);
        return callback (req.validationErrors ());
      },

      then
    ], callback);
  };
};

  module.exports = exports = BaseController;
