var expect = require ('chai').expect
  ;

var Messaging = require ('../lib/Messaging')
  ;

describe ('Messaging', function () {
  var messaging;

  beforeEach (function () {
    messaging = new Messaging ();
  });

  describe ('new Messaging ()', function () {
    it ('should create a new Messaging object', function () {
      expect (messaging.messengers).to.have.keys (['_']);
    });
  });

  describe ('#getMessenger', function () {
    it ('should return the default messenger', function () {
      expect (messaging.getMessenger ('_')).to.not.be.undefined;
    });

    it ('should automatically create the undefined messenger', function () {
      expect (messaging.getMessenger ('@')).to.not.be.undefined;
    });
  });

  describe ('#hasMessenger', function () {
    it ('should have the default messenger', function () {
      expect (messaging.hasMessenger ('_')).to.be.true;
    });

    it ('should not have a undefined messenger', function () {
      expect (messaging.hasMessenger ('@')).to.not.be.true;
    });
  });
});