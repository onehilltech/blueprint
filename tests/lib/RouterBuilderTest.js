var path   = require ('path')
  , expect = require ('chai').expect
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  ;

describe ('RouterBuilder', function () {
  var routerBuilder;
  var routersPath;

  describe ('new RouterBuilder ()', function () {
    var appModule = new ApplicationModule ('test-module', path.resolve (__dirname, '../fixtures/app'));
    routersPath = path.resolve (__dirname, '../fixtures/app/routers');

    routerBuilder = new RouterBuilder (appModule.controllers);

    it ('should create a new RouterBuilder', function () {
      expect (routerBuilder._controllers).to.equal (appModule.controllers);
    });
  });
  
  describe ('#addRoutes', function () {
    var spec = require (path.join (routersPath, 'TestRouter'));

    it ('should add routes to the router', function () {
      routerBuilder.addSpecification (spec);
      var router = routerBuilder.getRouter ();

      expect (router.params).to.have.keys (['param1', 'param2']);
      expect (router.params.param1).to.have.length (1);
      expect (router.params.param2).to.have.length (1);

      expect (router.params.param1[0]).to.be.a.function;
      expect (router.params.param2[0]).to.be.a.function;
      
      expect (router.stack[2].route.path).to.equal ('/helloworld');
      expect (router.stack[4].route.path).to.equal ('/helloworld/inner');
    });
  })
});