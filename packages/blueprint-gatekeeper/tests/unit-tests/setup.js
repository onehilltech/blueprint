'use strict';

const path    = require ('path')
  , blueprint = require ('@onehilltech/blueprint')
  ;

before (function (done) {
  const appPath = path.resolve (__dirname, '../../app');
  blueprint.createApplicationAndStart (appPath, done);
});

beforeEach (function (done) {
  blueprint.app.restart (done);
});
