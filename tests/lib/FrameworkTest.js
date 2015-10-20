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

  describe ('destroy', function () {
    it ('should destroy the framework', function () {
      Framework.destroy ();
      expect (process.mainModule.xpression).to.be.undefined;
    });
  });

  describe ('version', function () {
    it ('should equal the version package.json', function () {
      var version = require ('../../package.json').version;

      expect (Framework.version).to.not.be.undefined;
      expect (Framework.version).to.equal (version);
    });
  });
});