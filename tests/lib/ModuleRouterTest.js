var expect = require ('chai').expect
  , async  = require ('async')
  , path   = require ('path')
  ;

var appFixture = require ('../fixtures/app')
  , ModuleRouter = require ('../../lib/ModuleRouter')
  , ApplicationModule = require ('../../lib/ApplicationModule')
  ;

describe ('ModuleRouter', function () {
  before (function (done) {
    var location  = path.resolve (__dirname, '../fixtures/app-module');
    var appModule = new ApplicationModule (location);

    async.waterfall ([
      function (callback) { appFixture (callback); },
      function (app, callback) {
        appModule.init (function (err) {
          return callback (err, app);
        });
      },
      function (app, callback) {
        app.addModule ('test-module', appModule, callback);
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