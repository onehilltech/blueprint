var expect = require ('chai').expect
  , async  = require ('async')
  ;

var Router = require ('../../../../lib/blueprint/Router')
  ;

describe ('RouterTest', function () {
  describe ('()', function () {
    it ('should return a router for the specified version', function () {
      var router = new Router ();

      expect (router).to.have.length (2);
      expect (router[0]).to.be.a.function;
      expect (router[1]).to.be.a.function;
    });
  });
});