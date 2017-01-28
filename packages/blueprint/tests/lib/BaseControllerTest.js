var util    = require ('util')
  , winston = require ('winston')
  ;

var appFixture        = require ('../fixtures/app')
  , blueprint         = require ('../fixtures/lib')
  ;

describe ('blueprint.BaseController', function () {
  before (function (done) {
    appFixture (done);
  });

  describe ('checkSchemaThen', function () {
    it ('should run the checkSchemaThen validate', function (done) {
      blueprint.testing.request ()
        .post ('/base/testCheckSchemaThen')
        .send ({email: 'test@test.com'})
        .expect (200, {email: 'test@test.com'}, done);
    });
  });
});