const expect = require ('chai').expect;
const SimpleListener = require ('../../../../lib/messaging/simple-listener');


describe ('lib | messaging | SimpleListener', function () {

  function foo (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  context ('constructor', function () {
    it ('should create a SimpleListener object', function () {
      const listener = new SimpleListener (foo);
      expect (listener.listener).to.equal (foo);
    });
  });

  context ('event', function () {
    it ('should call the legacy listener function', function () {
      const listener = new SimpleListener (foo.bind (this));
      listener.handleEvent (5, 10);

      expect (this.p1).to.equal (5);
      expect (this.p2).to.equal (10);
    });
  });
});
