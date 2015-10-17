var expect = require ('chai').expect
  ;

var Framework = require ('../../lib/Framework')
  ;

describe ('Framework', function () {
  describe ('new Framework ()', function () {
    it ('should create a new framework', function () {
      var framework = new Framework ();

      expect (framework.hasApplication()).to.be.false;
      expect (framework.messaging).to.not.be.undefined;
    });
  });
});