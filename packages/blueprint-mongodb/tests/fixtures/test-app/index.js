'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , path        = require ('path')
  , async       = require ('async')
  ;

const appPath = path.resolve (__dirname, './app');

module.exports = function (callback) {
  blueprint.createApplicationAndStart (appPath, callback);
};

