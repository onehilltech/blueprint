var expect = require ('chai').expect
  , path   = require ('path')
  ;

var ApplicationModule = require ('../lib/ApplicationModule')
  ;

describe ('ApplicationModule', function () {
  var appModule;

  describe ('new ApplicationModule ()', function () {
    it ('should create a new application module', function () {
      var appPath = path.resolve (__dirname, './fixtures/app');
      appModule = new ApplicationModule (appPath);

      expect (appModule._appPath).to.equal (appPath);
      expect (appModule._listeners).to.be.undefined;
      expect (appModule._controllers).to.be.undefined;
      expect (appModule._models).to.be.undefined;
      expect (appModule._routers).to.be.undefined;
    });
  });

  describe ('#models', function () {
    it ('should return the loaded models', function () {
      expect (appModule.models).to.have.deep.property ('TestModel1')
      expect (appModule.models).to.have.deep.property ('inner.TestModel2');
    });
  });
});