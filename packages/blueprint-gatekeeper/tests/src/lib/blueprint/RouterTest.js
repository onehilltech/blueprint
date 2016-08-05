var expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Router    = require ('../../../../lib/blueprint/Router')
  ;

var appFixture = require ('../../../fixtures/app')
  ;

describe ('RouterTest', function () {
  describe ('()', function () {
    before (function (done) {
      async.waterfall ([
        function (callback) { appFixture (callback); },
        function (app, callback) { app.addModule ('gatekeeper', app.appPath, callback); }
      ], done);
    });

    it ('should return a router for the specified version', function (done) {
      messaging.once ('gatekeeper.router.init', function (result) {
        expect (router).to.equal (result);
        expect (router).to.be.a.function;
        expect (router.stack).to.have.length (2);

        return done ();
      });

      var router = Router ('gatekeeper', 1);
    });
  });
});