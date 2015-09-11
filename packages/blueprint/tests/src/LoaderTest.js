var expect = require ('chai').expect
  , path   = require ('path')
  ;

var Loader = require ('../../lib/Loader')
  ;

describe ('Loader', function () {
  describe ('#loadModels', function () {
    it ('should load the models', function () {
      var models = Loader.loadModels (path.resolve (__dirname, '../fixtures/app/models'));

      expect (models).to.have.deep.property ('TestModel1')
      expect (models).to.have.deep.property ('inner.TestModel2');
    });
  });

  describe ('#loadControllers', function () {
    it ('should load the controllers', function () {
      var TestController = require ('../fixtures/app/controllers/TestController');
      var controllers = Loader.loadControllers(path.resolve (__dirname, '../fixtures/app/controllers'));

      expect (controllers).to.have.property ('TestController');
      expect (controllers['TestController']).to.be.instanceof (TestController);
    });
  });

  describe ('#loadListeners', function () {
    var Messaging = require ('../../lib/Messaging');
    var listenerPath = path.resolve (__dirname, '../fixtures/app/listeners');

    var messaging = new Messaging ();
    var listeners = Loader.loadListeners (listenerPath, messaging);

    it ('should load listeners for 1 event type', function () {
      expect(listeners).to.have.keys(['app.init']);
    });

    it ('should have 2 different messengers', function () {
      expect (messaging.messengers).to.have.keys (['_', 'testTarget']);
    });

    it ('should only have 1 listener for each messenger', function () {
      expect (messaging.getMessenger ('_').listeners).to.have.length (1);
      expect (messaging.getMessenger ('testTarget').listeners).to.have.length (1);
    });
  });
});