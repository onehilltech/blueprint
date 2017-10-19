'use strict';

const expect   = require ('chai').expect
  , async      = require ('async')
  , blueprint  = require ('../../lib')
  , appFixture = require ('../fixtures/app')
  ;

describe ('blueprint', function () {
  describe ('module.exports', function () {
    it ('should have keys for events', function () {
      expect (blueprint).to.exist;

      const keys = [
        'createApplication',
        'createApplicationAndStart',
        'destroyApplication',
        'BaseController',
        'Controller',
        'barrier',
        'require',
        'ResourceController',
        'Policy',
        'controller',
        'errors',
        'http'
      ];

      expect (blueprint).to.have.keys (keys);
    });
  });

  describe ('blueprint()', function () {
    before (function (done) {
      async.waterfall ([
        function (callback) {
          blueprint.destroyApplication (callback);
        },
        function (callback) {
          appFixture (callback);
        }
      ], done);
    });

    it ('should resolve a model', function () {
      expect (blueprint ('model://Person')).to.exist;
      expect (blueprint ('model://inner.TestModel2')).to.exist;
    });

    it ('should resolve a module controller', function () {
      expect (blueprint ('controller://ModuleTestController')).to.exist;
      expect (blueprint ('controller://test-module:ModuleTestController')).to.exist;

      expect (blueprint ('router://test-module:ModuleTest')).to.exist;
      expect (blueprint ('router://test-module:inner')).to.exist;
    });
  });
});