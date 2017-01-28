'use strict';

module.exports = ErrorController;

var blueprint = require ('../../../../lib')
  , errors    = blueprint.errors
  ;

function ErrorController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (ErrorController);

ErrorController.prototype.blueprintError = function () {
  return {
    execute: function (req, res, callback) {
      return callback (new errors.Error ('test_error', 'This is a test error', {n: 1}))
    }
  };
};

ErrorController.prototype.httpError = function () {
  return {
    execute: function (req, res, callback) {
      return callback (new errors.HttpError (400, 'http_error', 'This is a http error', {n: 2}))
    }
  };
};

