var expect = require ('chai').expect
  ;

var appFixture = require ('../../../fixtures/app')
  , Router = require ('../../../../lib/blueprint/Router')
  ;

describe ('RouterTest', function () {
  before (function (done) {
    appFixture (done);
  });

  describe ('()', function () {
    it ('should return a router for the specified version', function () {
      var router = Router ();

      expect (router).to.have.length (2);
      expect (router[0]).to.be.a.function;
      expect (router[1]).to.be.a.function;
    });
  });
});