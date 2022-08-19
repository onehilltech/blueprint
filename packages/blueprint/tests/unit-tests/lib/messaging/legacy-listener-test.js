const expect = require ('chai').expect;
const SimpleListener = require ('../../../../lib/messaging/simple-listener');


describe ('lib | messaging | SimpleListener', function () {
  function foo (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  context ('create()', function () {
    it ('should create a SimpleListener object', function () {
      let legacyListener = new SimpleListener ({listener: foo});

      expect (legacyListener).to.be.instanceof (SimpleListener);
    });
  });

  context ('event()', function () {
    it ('should call the legacy listener function', function () {
      let legacyListener = new SimpleListener (foo);
      legacyListener.handleEvent (5, 10);

      expect (foo.p1).to.equal (5);
      expect (foo.p2).to.equal (10);
    });
  });
});
