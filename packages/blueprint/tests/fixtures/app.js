'use strict';

var path      = require ('path')
  , async     = require ('async')
  , blueprint = require ('./lib')
  ;

module.exports = function (callback) {
  var appPath = path.resolve (__dirname, 'app');
  var app = blueprint.Application (appPath, callback);
};
