const expect = require ('chai').expect;
const ListenerHandle = require ('../../../../lib/messaging/listener-handle');

describe ('lib | messaging | ListenerHandle', function () {
  describe ('create()', function () {
    it ('should create a new ListenerHandle', function () {
      new ListenerHandle ({listeners: {}, index: 0});
    });

    context ('missing listeners', function () {
      it ('should throw an exception', function () {
        expect (() => { new ListenerHandle (); }).to.throw;
      });
    });

    context ('missing index', function () {
      it ('should throw an exception', function () {
        expect (() => { new ListenerHandle ({listeners: {}}); }).to.throw;
      });
    });
  });

  describe ('close()', function () {
    it ('should close the listener handle', function () {
      let listeners = {
        removeListenerAt (index) {
          this.removed = index;
        }
      };

      let handle = new ListenerHandle (listeners, 7);
      handle.close ();

      expect (listeners.removed).to.equal (7);
    });

    it ('should not double-close listener handle', function () {
      let listeners = {
        removeListenerAt (index) {
          this.removed = index;
        }
      };

      let handle = new ListenerHandle (listeners, 7);
      handle.close ();
      handle.close ();
    });
  })
});
