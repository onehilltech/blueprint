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

  describe ('#listeners', function () {
    it ('should return the loaded listeners', function () {
      expect (appModule.listeners).to.have.property ('app.init');
      expect (appModule.listeners['app.init']).to.have.keys (['TestListener', 'TargetListener']);
      expect (appModule.listeners['app.init']['TargetListener']).to.have.property ('targetMessenger');
    });
  });

  describe ('#models', function () {
    it ('should return the loaded models', function () {
      expect (appModule.models).to.have.deep.property ('TestModel1')
      expect (appModule.models).to.have.deep.property ('inner.TestModel2');
    });
  });

  describe ('#controllers', function () {
    it ('should return the loaded controllers', function () {
      expect (appModule.controllers).to.have.property ('TestController');
    });
  });
});