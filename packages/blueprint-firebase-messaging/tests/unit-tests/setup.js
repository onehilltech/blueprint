'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , path        = require ('path')
  ;

before (function (done) {
  const appPath = path.resolve (__dirname, '../../app');
  blueprint.createApplicationAndStart (appPath, done);
});
