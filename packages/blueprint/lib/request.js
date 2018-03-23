'use strict';

const async = require ('async')
  ;

var exports = module.exports = {};

function validate (opts) {
  if (_.isFunction (opts)) {
    return opts;
  }
  else if (_.isArray (opts)) {
    return function (req, callback) {
      async.each (opts, function (item, callback) {
        validate (item).call (null, req, callback);
      }, callback);
    }
  }
  else if (_.isObject (opts)) {
    return function (req, callback) {
      req.check (opts);
      return callback (null);
    }
  }
  else {
    throw new Error ('Invalid parameter');
  }
}

exports.validate = validate;

exports.sanitize = function (opts) {
  if (_.isFunction (opts)) {
    return opts;
  }
  else if (_.isArray (opts)) {
    return function (req, callback) {
      async.each (opts, function (func, callback) {
        func (req, callback);
      }, callback);
    }
  }
  else {
    throw new Error ('Invalid parameter');
  }
};
