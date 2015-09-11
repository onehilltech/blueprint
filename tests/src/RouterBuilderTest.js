var path   = require ('path')
  , expect = require ('chai').expect
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  ;

describe ('RouterBuilder', function () {
  var routerBuilder;

  describe ('new RouterBuilder ()', function () {
    var appModule = new ApplicationModule (path.resolve (__dirname, './fixtures/app'));
    var routersPath = path.resolve (__dirname, '../fixtures/app/routers');
    routerBuilder = new RouterBuilder (routersPath, appModule.controllers);

    it ('should create a new RouterBuilder', function () {
      expect (routerBuilder._routerPath).to.equal (routersPath);
      expect (routerBuilder._controllers).to.equal (appModule.controllers);
      expect (routerBuilder._currPath).to.equal ('/');
    });
  });
});