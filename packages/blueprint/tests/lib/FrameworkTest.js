var expect = require ('chai').expect
  ;

var Framework = require ('../../lib/Framework')
  ;

describe ('Framework', function () {
  describe ('Framework ()', function () {
    it ('should return the framework instance', function () {
      var framework = Framework ();

      expect (framework.messaging).to.not.be.undefined;
    });

    it ('should should be stored in the process module', function () {
      var framework = Framework ();

      expect (framework).to.equal (process.mainModule.xpression);
    });
  });
});