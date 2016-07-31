var expect     = require ('chai').expect
  , path       = require ('path')
  , async      = require ('async')
  , fs         = require ('fs')
  , blueprint  = require ('../fixtures/lib')
  , appFixture = require ('../fixtures/app')
  ;

var ApplicationModule = blueprint.ApplicationModule
  ;

describe ('ApplicationModule', function () {
  var appModule;

  before (function (done) {
    appFixture (done);
  });

  describe ('new ApplicationModule', function () {
    it ('should create a new application module', function () {
      var appPath = path.resolve (__dirname, '../fixtures/app');
      appModule = new ApplicationModule (appPath);

      expect (appModule.appPath).to.equal (appPath);
    });
  });

  describe ('#init', function () {
    it ('should initialize the application module', function (done) {
      appModule.init (function (err, module) {
        if (err) return done (err);

        expect (module._is_init).to.be.true;
        expect (module.controllerManager).to.be.defined;
        expect (module.modelManager).to.be.defined;
        expect (module.routerManager).to.be.defined;
        expect (module.listenerManager).to.be.defined;
        expect (module.policyManager).to.be.defined;

        return done ();
      });
    });
  });

  describe ('#listeners', function () {
    it ('should return the loaded listeners', function () {
      expect (appModule.listeners).to.have.keys (['app.init', 'custom.event']);
      expect (appModule.listeners['app.init']).to.have.keys (['TestListener', 'TargetListener']);
      expect (appModule.listeners['app.init']['TargetListener']).to.have.property ('targetMessenger');
      expect (appModule.listeners['custom.event']).to.have.keys (['CustomListener1', 'CustomListener2']);

      expect (blueprint.messaging.messengers).to.have.keys (['_', 'testTarget']);
      expect (blueprint.messaging.getMessenger ('_').emitter.listeners).to.have.length (1);
      expect (blueprint.messaging.getMessenger ('testTarget').emitter.listeners).to.have.length (1);
    });
  });

  describe ('#models', function () {
    it ('should return the loaded models', function () {
      expect (appModule.models).to.have.deep.property ('TestModel1');
      expect (appModule.models).to.have.deep.property ('inner.TestModel2');
    });
  });

  describe ('#controllers', function () {
    it ('should return the loaded controllers', function () {
      expect (appModule.controllers).to.have.property ('TestController');
    });
  });

  describe ('#policies', function () {
    it ('should return the loaded policies', function () {
      expect (appModule.policies).to.have.keys (['always_true']);
    });
  });
});