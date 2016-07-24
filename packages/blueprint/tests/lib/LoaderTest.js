var expect = require ('chai').expect
  , path   = require ('path')
  ;

var blueprint = require ('../fixtures/lib')
  , Loader    = require ('../../lib/Loader')
  ;

describe ('Loader', function () {
  var models;
  var controllers;

  describe ('#loadModels', function () {
    // The model loader only works if we have an application in place that has
    // a database. Otherwise, the blueprint.model () method will not function
    // properly.
    before (function () {
      blueprint.destroy ();

      var appPath = path.resolve (__dirname, '../fixtures/app');
      blueprint.Application (appPath);
    });

    it ('should load the models', function () {
      var modelPath = path.resolve (__dirname, '../fixtures/app/models');
      models = Loader.loadModels (modelPath);

      expect (models).to.have.deep.property ('TestModel1');
      expect (models).to.have.deep.property ('inner.TestModel2');
    });
  });

  describe ('#loadControllers', function () {
    it ('should load the controllers', function () {
      var TestController = require ('../fixtures/app/controllers/TestController');
      controllers = Loader.loadControllers(path.resolve (__dirname, '../fixtures/app/controllers'));

      expect (controllers).to.have.property ('TestController');
      expect (controllers['TestController']).to.be.instanceof (TestController);
    });
  });

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

  describe ('#loadListeners', function () {
    var Messaging = require ('../../lib/Messaging');
    var listenerPath = path.resolve (__dirname, '../fixtures/app/listeners');

    var messaging = new Messaging ();
    var listeners = Loader.loadListeners (listenerPath, messaging);

    it ('should load listeners for 2 event types', function () {
      expect (listeners).to.have.keys(['app.init', 'custom.event']);
      expect (listeners['app.init']).to.have.keys (['TestListener', 'TargetListener']);
      expect (listeners['app.init']['TargetListener']).to.have.property ('targetMessenger');
      expect (listeners['custom.event']).to.have.keys (['CustomListener1', 'CustomListener2']);
    });

    it ('should have 2 different messengers', function () {
      expect (messaging.messengers).to.have.keys (['_', 'testTarget']);
    });

    it ('should only have 1 listener for each messenger', function () {
      expect (messaging.getMessenger ('_').emitter.listeners).to.have.length (1);
      expect (messaging.getMessenger ('testTarget').emitter.listeners).to.have.length (1);
    });
  });
});