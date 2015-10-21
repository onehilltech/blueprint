var expect    = require ('chai').expect
  , path      = require ('path')
  , xpression = require ('../fixtures/xpression')
  ;

var ApplicationModule = xpression.ApplicationModule
  ;

describe ('ApplicationModule', function () {
  var appModule;

  before (function () {
    var appPath = path.resolve (__dirname, '../fixtures/app-empty');
    xpression.Application (appPath);
  });

  after (function () {
    xpression.destroy ();
  });

  describe ('new ApplicationModule', function () {
    it ('should create a new application module', function () {
      var appPath = path.resolve (__dirname, '../fixtures/app');
      appModule = new ApplicationModule (appPath);

      expect (appModule.appPath).to.equal (appPath);

      expect (appModule._listeners).to.be.undefined;
      expect (appModule._controllers).to.be.undefined;
      expect (appModule._models).to.be.undefined;
      expect (appModule._routers).to.be.undefined;
    });
  });

  describe ('#listeners', function () {
    it ('should return the loaded listeners', function () {
      expect (appModule.listeners).to.have.keys (['app.init', 'custom.event']);
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