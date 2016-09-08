var expect = require ('chai').expect
  ;

var Messaging = require ('../../lib/Messaging')
  ;

describe ('Messaging', function () {
  var messaging;
  var handle;

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

  describe ('#on', function () {
    it ('should add a listener to the default messenger', function () {
      messaging.on ('testing', function () { });
      expect (messaging.getMessenger ('_').listeners).to.have.keys (['testing']);
    });
  });

  describe ('#emit', function () {
    it ('should emit an event to the default messenger', function (done) {
      messaging.on ('testing', function () { done (); });
      messaging.emit ('testing');
    });
  });

  describe ('#relay', function () {
    it ('should relay a callback as an event', function (done) {
      messaging.on ('foo.bar', function (err, a, b, c) {
        expect (err).to.be.null;
        expect (a).to.equal (1);
        expect (b).to.equal (2);
        expect (c).to.equal (3);

        return done ();
      });

      var callback = messaging.relay ('foo.bar');
      callback.call (null, null, 1, 2, 3);
    });
  });
});