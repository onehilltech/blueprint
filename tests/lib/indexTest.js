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
        'GridFSController',
        'RouterBuilder',
        'ModuleRouter',
        'Policy',
        'controller',
        'model',
        'destroy',
        'include',
        'errors'
      ];

      expect (blueprint).to.have.keys (keys);
    });
  });
});