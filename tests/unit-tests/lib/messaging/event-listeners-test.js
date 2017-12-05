const EventListeners = require ('../../../../lib/messaging/event-listeners');
const Listener = require ('../../../../lib/messaging/listener');
const NoopListener = require ('../../../../lib/messaging/noop-listener');
const expect = require ('chai').expect;

describe ('lib | messaging | EventListeners', function () {
  describe ('create()', function () {
    it ('should create an EventListener object', function () {
      let listeners = new EventListeners ({name: 'foo'});

      expect (listeners).to.deep.include ({name: 'foo', _on: [], _once: []});
    });
  });

  describe ('on()', function () {
    it ('should add a new listener', function () {
      let listeners = new EventListeners ({name: 'foo'});
      listeners.on (new NoopListener ());

      expect (listeners._on).to.have.length (1);
    });
  });

  describe ('once()', function () {
    it ('should add a new listener', function () {
      let listeners = new EventListeners ({name: 'foo'});
      listeners.once (new NoopListener ());

      expect (listeners._once).to.have.length (1);
    });
  });

  describe ('removeListenerAt()', function () {
    it ('should remove a listener', function () {
      let listeners = new EventListeners ({name: 'foo'});

      listeners.on (new NoopListener ());
      listeners.removeListenerAt (0);

      expect (listeners._once).to.have.length (0);
    });
  });

  describe ('emit()', function () {
    it ('should emit an event', function (done) {
      let e1;
      let e2;

      let listeners = new EventListeners ({name: 'foo'});
      listeners.on (new Listener ({
        event (e) {
          e1 = e;
        }
      }));

      listeners.once (new Listener ({
        event (e) {
          e2 = e;
        }
      }));

      listeners.emit (5).then (() => {
        expect (e1).to.equal (5);
        expect (e2).to.equal (5);
        expect (listeners._once).to.have.length (0);

        done (null);
      }).catch (err => {
        done (err);
      })
    });
  });
});