const expect = require ('chai').expect;
const Listener = require ('../../../../lib/messaging/listener');

describe ('lib | Listener', function () {
  context ('#create', function () {
    it ('should create a Listener object', function () {
      let listener = new Listener ({
        handleEvent () {

        }
      });
      expect (listener).to.be.instanceof (Listener);
    });
  });

  context ('#doEvent', function () {
    it ('should invoke the doEvent method', function () {
      let handled = false;

      let listener = new Listener ({
        handleEvent (ev) {
          handled = ev;
        }
      });

      listener.handleEvent (6);

      expect (handled).to.equal (6);
    });
  });
});
