var expect    = require ('chai').expect
  , xpression = require ('../../lib')
  ;

describe ('index', function () {
  describe ('#', function () {
    it ('should have keys for events', function () {
      var keys = [
        'Application',
        'ApplicationModule',
        'BaseController',
        'controller',
        'emit',
        'model',
        'on'
      ];

      expect (xpression).to.have.keys (keys);
    });
  });
});