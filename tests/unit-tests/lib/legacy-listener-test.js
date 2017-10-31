const expect       = require ('chai').expect
  , LegacyListener = require ('../../../lib/legacy-listener')
;


describe ('lib | LegacyListener', function () {
  let val1 = null, val2 = null;

  function foo (p1, p2) {
    val1 = p1;
    val2 = p2;
  }

  context ('create()', function () {
    it ('should create a LegacyListener object', function () {
      let legacyListener = new LegacyListener ({listener: foo});

      expect (legacyListener).to.be.instanceof (LegacyListener);
    });
  });

  context ('doEvent()', function () {
    it ('should call the legacy listener function', function () {
      let legacyListener = new LegacyListener ({listener: foo});
      legacyListener.doEvent (5, 10);

      expect (val1).to.equal (5);
      expect (val2).to.equal (10);
    });
  });
});
