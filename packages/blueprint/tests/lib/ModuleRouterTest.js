var expect = require ('chai').expect
  , async  = require ('async')
  , path   = require ('path')
  ;

var appFixture = require ('../fixtures/app')
  , ModuleRouter = require ('../../lib/ModuleRouter')
  ;

describe ('ModuleRouter', function () {
  before (function (done) {
    async.waterfall ([
      function (callback) { appFixture (callback); },
      function (app, callback) {
        var location = path.resolve (__dirname, '../fixtures/app-module');
        app.addModule ('test-module', location, callback);
      }
    ], done);
  });

  describe ('()', function () {
    it ('should load the router definition from a module', function (done) {
      var router = ModuleRouter ('test-module:ModuleTest');

      expect (router).to.be.a.function;

      return done ();
    });
  });
});