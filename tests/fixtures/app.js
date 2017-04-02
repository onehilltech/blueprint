'use strict';

var path      = require ('path')
  , async     = require ('async')
  , blueprint = require ('./lib')
  ;

module.exports = function (callback) {
  // Remove all previous barriers.
  blueprint.barrier.removeAll ();

  // Create the application.
  var appPath = path.resolve (__dirname, 'app');
  blueprint.createApplication (appPath, callback);
};
