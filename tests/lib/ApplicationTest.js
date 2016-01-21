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
    app = blueprint.Application (appPath);
  });

  describe ('new Application ()', function () {
    it ('should create a new application', function () {
      expect (app).to.be.instanceof (blueprint.ApplicationModule);
    });
  });

  describe ('#init', function () {
    var dataPath = path.resolve (__dirname, '../fixtures/app/data');

    it ('should initialize the application', function () {
      app.init ();

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
    it ('should start the application', function (done) {
      app.start (done);
    });

    it ('should seed the database', function (done) {
      var TestModel1 = app.models.TestModel1;

      TestModel1.find ({}, function (err, models) {
        if (err) return done (err);

        expect (models).to.have.length (4);
        return done ();
      });
    });
  });
});