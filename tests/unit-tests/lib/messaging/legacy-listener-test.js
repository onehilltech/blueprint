const expect = require ('chai').expect;
const LegacyListener = require ('../../../../lib/messaging/legacy-listener');


describe ('lib | LegacyListener', function () {
  function foo (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  context ('create()', function () {
    it ('should create a LegacyListener object', function () {
      let legacyListener = new LegacyListener ({listener: foo});

      expect (legacyListener).to.be.instanceof (LegacyListener);
    });
  });

  context ('event()', function () {
    it ('should call the legacy listener function', function () {
      let legacyListener = new LegacyListener ({listener: foo});
      legacyListener.event (5, 10);

      expect (foo.p1).to.equal (5);
      expect (foo.p2).to.equal (10);
    });
  });
});
