var expect    = require ('chai').expect
  , path      = require ('path')
  , async     = require ('async')
  , fs        = require ('fs')
  , blueprint = require ('../fixtures/lib')
  ;

var ApplicationModule = blueprint.ApplicationModule
  ;

describe ('ApplicationModule', function () {
  var appPath = path.resolve (__dirname, '../fixtures/app');
  var appModule;

  before (function () {
    blueprint.destroy ();
    blueprint.Application (appPath);
  });

  describe ('new ApplicationModule', function () {
    it ('should create a new application module', function () {
      appModule = new ApplicationModule ('test-module', appPath);
      expect (appModule.appPath).to.equal (appPath);
    });

    it ('should have the name test-app', function () {
      expect (appModule.moduleName).to.equal ('test-module');
    });
  });

  describe ('#load', function () {
    it ('should load an application module into the main application', function (done) {
      var modulePath = path.resolve (__dirname, '../fixtures/app-module');
      blueprint.include ('test-module', modulePath);

      expect (blueprint.app._modules).to.have.keys (['test-module']);

      var files = [
        path.join (appPath, 'data', 'views', 'module-first-level.jade'),
        path.join (appPath, 'data', 'views', 'inner', 'module-second-level.jade')
      ];

      async.each (files, function (file, callback) {
        fs.stat (file, function (err, stat) {
          if (err) return callback (err);
          expect (stat.isFile()).to.be.true;

          return callback ();
        });
      }, done);
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
      expect (appModule.models).to.have.deep.property ('TestModel1')
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