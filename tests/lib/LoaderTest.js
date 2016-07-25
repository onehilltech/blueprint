var expect = require ('chai').expect
  , path   = require ('path')
  ;

var blueprint = require ('../fixtures/lib')
  , Loader    = require ('../../lib/Loader')
  ;

describe ('Loader', function () {
  describe ('#loadRouters', function () {
    it ('should load the routers', function () {
      var routersPath = path.resolve (__dirname, '../fixtures/app/routers');
      var routers = Loader.loadRouters (routersPath, controllers);

      expect (routers).to.have.deep.property ('Test').that.is.a.function;
      expect (routers.Test.stack).to.have.length (3);

      expect (routers).to.have.deep.property ('inner').that.is.a.object;
      expect (routers).to.have.deep.property ('inner.InnerTest').that.is.a.function;

      expect (routers.inner.InnerTest.stack).to.have.length (2);
    });
  });
});