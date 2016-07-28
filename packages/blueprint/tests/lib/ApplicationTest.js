var expect = require ('chai').expect
  , path   = require ('path')
  , async  = require ('async')
  , fs     = require ('fs')
  ;

var Application = require ('../../lib/Application')
  , ApplicationModule = require ('../../lib/ApplicationModule')
  ;

describe ('Application', function () {
  var appPath = path.resolve (__dirname, '../fixtures/app');
  var app;

  describe ('new Application ()', function () {
    it ('should create and initialize a new application', function () {
      app = new Application (appPath);
      expect (app).to.be.instanceof (ApplicationModule);
    });
  });

  describe ('#init', function () {
    it ('should initialize the application', function (done) {
      app.init (function (err, app) {
        if (err) return done (err);

        async.parallel ([
          function (callback) {
            expect (app.server).to.not.be.undefined;
            expect (app.database).to.not.be.undefined;
            return callback ();
          },
          function (callback) {
            // Make sure the data directory has been created.
            var dataPath = path.resolve (app.appPath, '/data');

            fs.stat (dataPath, function (err, stats) {
              if (err) return callback (err);
              expect (stats.isDirectory ()).to.be.true;
              return callback ();
            });
          },

          function (callback) {
            // Make sure the views have been copied.
            var viewsPath = path.join (app.appPath, 'data/views');

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
            }, callback);
          }
        ], done);
      });
    });
  });

  describe.skip ('#start', function () {
    it ('should start the application', function (done) {
      app.start (done);
    });
  });
});