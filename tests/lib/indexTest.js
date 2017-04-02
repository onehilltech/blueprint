var expect    = require ('chai').expect
  , blueprint = require ('../../lib')
  ;

describe ('index', function () {
  describe ('module.exports', function () {
    it ('should have keys for events', function () {
      var keys = [
        'createApplication',
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
});