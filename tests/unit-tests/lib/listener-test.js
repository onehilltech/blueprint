const expect = require ('chai').expect
  , Listener = require ('../../../lib/listener')
  ;

describe ('lib | Listener', function () {
  context ('#create', function () {
    it ('should create a Listener object', function () {
      let listener = new Listener ({});
      expect (listener).to.be.instanceof (Listener);
    });
  });

  context ('#doEvent', function () {
    it ('should invoke the doEvent method', function () {
      let handled = false;

      let listener = new Listener ({
        doEvent (ev) {
          handled = ev;
        }
      });

      listener.doEvent (6);

      expect (handled).to.equal (6);
    });
  });
});
