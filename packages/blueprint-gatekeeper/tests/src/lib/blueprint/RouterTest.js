var expect = require ('chai').expect
  , blueprint = require ('@onehilltech/blueprint')
  ;

var appFixture = require ('../../../fixtures/app')
  ;

describe ('RouterTest', function () {
  before (function (done) {
    appFixture (done);
  });

  describe ('()', function () {
    it ('should return a router for the specified version', function () {
      var router = require ('../../../../lib/blueprint/Router');
      
      expect (router).to.be.a.function;
      expect (router.stack).to.have.length (2);
    });
  });
});