var path = require ('path')
  , expect = require ('chai').expect
  , testing = require ('../../../lib/testing')
  , blueprint = require ('../../../lib')
  , messaging = blueprint.messaging
  ;

describe ('testing', function () {
  describe ('waitFor', function () {
    it ('should wait for a condition to continue', function (done) {
      var recv = false;

      messaging.on ('waitFor.complete', function () {
        recv = true;
      });

      messaging.emit ('waitFor.complete');

      testing.waitFor (function () {
        return recv;
      }, done);
    });
  });

  describe ('createApplicationAndStart', function () {
    it ('should create an application and start it', function (done) {
      var started = false;

      messaging.on ('app.start', function handleStart (app) {
        started = true;
      });

      var appPath = path.resolve (__dirname, '../../fixtures/app');

      testing.createApplicationAndStart (appPath, function (err, app) {
        if (err) return done (err);
        expect (app).to.not.be.null;
      });

      testing.waitFor (function () {
        return started;
      }, done)
    });
  });
});