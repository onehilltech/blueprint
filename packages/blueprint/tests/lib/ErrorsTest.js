var appFixture        = require ('../fixtures/app')
  , blueprint         = require ('../fixtures/lib')
  ;

describe ('blueprint.errors', function () {
  before (function (done) {
    appFixture (done);
  });

  describe ('BlueprintError', function () {
    it ('should return an BlueprintError', function (done) {
      blueprint.testing.request ()
        .get ('/errors/blueprint')
        .expect (500, {errors: {code: 'test_error', message: 'This is a test error', details: {n: 1}}}, done);
    });
  });

  describe ('HttpError', function () {
    it ('should return an HttpError', function (done) {
      blueprint.testing.request ()
        .get ('/errors/http')
        .expect (400, {errors: {code: 'http_error', message: 'This is a http error', details: {n: 2}}}, done);
    });
  });
});