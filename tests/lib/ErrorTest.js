var path    = require ('path')
  , expect  = require ('chai').expect
  , async   = require ('async')
  , request = require ('supertest')
  , util    = require ('util')
  , winston = require ('winston')
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  , appFixture        = require ('../fixtures/app')
  , blueprint         = require ('../fixtures/lib')
  ;

describe ('blueprint.errors', function () {
  var app;

  before (function (done) {
    appFixture (function (err, a) {
      if (err) return done (err);
      app = a;

      return done (null);
    });
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