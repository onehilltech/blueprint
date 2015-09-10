var expect = require ('chai').expect
  , path   = require ('path')
  ;

var Application       = require ('../lib/Application')
  , ApplicationModule = require ('../lib/ApplicationModule')
  ;

describe ('Application', function () {
  var appModule;

  describe ('new Application ()', function () {
    it ('should create a new application', function (done) {
      var appPath = path.resolve (__dirname, './fixtures/app');

      app = Application (appPath, function (app) {
        expect (app).to.be.instanceof (ApplicationModule);
        done ();
      });

      expect (app).to.be.instanceof (ApplicationModule);
    });
  });

  describe ('#server', function () {
    it ('should return the configured server', function () {
      expect (app.server).to.not.be.undefined;
    });
  });

  describe ('#database', function () {
    it ('should return the configured database', function () {
      expect (app.database).to.not.be.undefined;
    });
  });
});