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
        .expect (500, {errors: [{status: '500', code: 'test_error', detail: 'This is a test error', meta: {n: 1}}]}, done);
    });
  });

  describe ('HttpError', function () {
    it ('should return an HttpError', function (done) {
      blueprint.testing.request ()
        .get ('/errors/http')
        .expect (400, {errors: [{status: '400', code: 'http_error', detail: 'This is a http error', meta: {n: 2}}]}, done);
    });
  });
});