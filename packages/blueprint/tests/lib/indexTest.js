var expect    = require ('chai').expect
  , blueprint = require ('../../lib')
  ;

describe ('index', function () {
  describe ('module.exports', function () {
    it ('should have keys for events', function () {
      var keys = [
        'Application',
        'ApplicationModule',
        'BaseController',
        'ResourceController',
        'RouterBuilder',
        'ModuleRouter',
        'Policy',
        'controller',
        'destroy',
        'errors'
      ];

      expect (blueprint).to.have.keys (keys);
    });
  });
});