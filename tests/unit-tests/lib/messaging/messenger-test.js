const Messenger = require ('../../../../lib/messaging/messenger');
const EventListeners = require ('../../../../lib/messaging/event-listeners');
const ListenerHandle = require ('../../../../lib/messaging/listener-handle');
const NoopListener = require ('../../../../lib/messaging/noop-listener');
const expect = require ('chai').expect;

describe ('lib | messaging | Messenger', function () {
  describe ('create()', function () {
    it ('should create a Messenger object', function () {
      let messenger = new Messenger ({key: '_'});

      expect (messenger).to.have.property ('key', '_');
      expect (messenger).to.have.deep.property ('_listeners', {});
    });
  });

  describe ('lookup()', function () {
    it ('should lookup a listener container', function () {
      let messenger = new Messenger ({key: '_'});
      let listeners = messenger.lookup ('a.b');

      expect (listeners).to.be.instanceof (EventListeners);
      expect (listeners).to.have.property ('name', 'a.b');
    });
  });

  describe ('on()', function () {
    it ('should register handler for event', function () {
      let messenger = new Messenger ({key: '_'});
      let handle = messenger.on ('a.b', new NoopListener ());

      expect (handle).to.be.instanceof (ListenerHandle);
    });
  });
});
