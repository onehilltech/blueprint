'use strict';

const expect   = require ('chai').expect
  , blueprint  = require ('../../lib')
  , appFixture = require ('../fixtures/app')
  ;

describe ('blueprint', function () {
  describe ('module.exports', function () {
    it ('should have keys for events', function () {
      var keys = [
        'createApplication',
        'createApplicationAndStart',
        'destroyApplication',
        'BaseController',
        'Controller',
        'barrier',
        'ResourceController',
        'ModuleRouter',
        'Policy',
        'controller',
        'errors',
        'http'
      ];

      expect (blueprint).to.have.keys (keys);
    });
  });

  describe ('blueprint ()', function () {
    var app;

    before (function (done) {
      appFixture (function (err, result) {
        if (err) return done (err);
        app = result;
        return done (null);
      });
    });

    it ('should resolve a model', function () {
      expect (blueprint ('model://Person')).to.be.a.function;
      expect (blueprint ('model://inner.TestModel2')).to.be.a.function;
    });
  });
});