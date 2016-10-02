var expect = require ('chai').expect
  , blueprint = require ('@onehilltech/blueprint')
  , appPath = require ('../../../fixtures/appPath')
  ;

describe ('CloudToken', function () {
  var CloudToken;

  before (function (done) {
    blueprint.testing.createApplicationAndStart (appPath, done);
  });

  describe ('()', function () {
    it ('should create a new CloudToken model', function () {
      var CloudToken = blueprint.app.models.CloudToken;

      expect (new CloudToken ({})).to.not.be.null;
    });
  })
});