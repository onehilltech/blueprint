var expect = require ('chai').expect
  , path   = require ('path')
  ;

var Application       = require ('../lib/Application')
  , ApplicationModule = require ('../lib/ApplicationModule')
  ;

describe ('Application', function () {
  var app;

  describe ('new Application ()', function () {
    it ('should create a new application', function () {
      var appPath = path.resolve (__dirname, './fixtures/app');
      app = new Application (appPath);

      expect (app).to.be.instanceof (ApplicationModule);
    });
  });

  describe ('#init', function () {
    it ('should initialize the application', function () {
      app.init ();

      expect (app.server).to.not.be.undefined;
      expect (app.database).to.not.be.undefined;
    });
  });
});