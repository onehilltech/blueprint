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
      handle = messaging.on ('testing', function () { });
      expect (handle.messenger.emitter.listeners ('testing')).to.have.length (1);
    });
  });

  describe ('#emit', function () {
    it ('should emit an event to the default messenger', function (done) {
      messaging.on ('testing', function () { done ();} );
      messaging.emit ('testing');
    });
  });

  describe ('#handle.close', function () {
    it ('should close the handle, removing the listener', function () {
      handle = messaging.on ('testing', function () { });
      handle.close ();

      expect (messaging.getMessenger ().emitter.listeners ('testing')).to.have.length (0);
    });
  });

  describe ('#relay', function () {
    it ('should relay a callback as an event', function (done) {
      messaging.once ('foo.bar', function (err, a, b, c) {
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