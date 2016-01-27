var expect = require ('chai').expect
  , path   = require ('path')
  , async  = require ('async')
  , fs     = require ('fs')
  ;

var blueprint = require ('../../lib')
  ;

describe ('Application', function () {
  var appPath = path.resolve (__dirname, '../fixtures/app');
  var app;

  before (function () {
    blueprint.destroy ();
  });

  describe ('new Application ()', function () {
    app  = blueprint.Application (appPath);
    var dataPath = path.resolve (__dirname, '../fixtures/app/data');

    it ('should create and initialize a new application', function () {
      expect (app).to.be.instanceof (blueprint.ApplicationModule);
      expect (app.server).to.not.be.undefined;
      expect (app.database).to.not.be.undefined;
    });

    it ('should create the /data directory', function (done) {
      fs.stat (dataPath, function (err, stats) {
        if (err) return done (err);

        expect (stats.isDirectory ()).to.be.true;
        return done ();
      });
    });

    it ('should copy the views into the /data/views directory', function (done) {
      var viewsPath = path.join (dataPath, 'views');

      var files = [
        path.join (viewsPath, 'first-level.jade'),
        path.join (viewsPath, 'inner', 'second-level.jade')
      ];

      async.each (files, function (item, callback) {
        fs.stat (item, function (err, stats) {
          if (err) return callback (err);

          expect (stats.isFile ()).to.be.true;
          return callback ();
        });
      }, done);
    });
  });

  describe ('#start', function () {
    it ('should start the application, with seeds', function (done) {
      app.start (function (err) {
        if (err) return done (err);

        var TestModel1 = app.models.TestModel1;

        TestModel1.find ({}, function (err, models) {
          if (err) return done (err);

          expect (models).to.have.length (4);
          return done ();
        });
      });
    });
  });
});