var expect = require ('chai').expect
  , path   = require ('path')
  , async  = require ('async')
  , fs     = require ('fs')
  , winston = require ('winston')
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
            return callback ();
          },
          function (callback) {
            // Make sure the data directory has been created.
            var tempPath = path.resolve (app.appPath, 'temp');

            fs.stat (tempPath, function (err, stats) {
              if (err) return callback (err);

              expect (stats.isDirectory ()).to.be.true;
              return callback ();
            });
          },

          function (callback) {
            // Make sure the views have been copied.
            var viewsPath = path.join (app.appPath, 'temp/views');

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
          },

          function (callback) {
            expect (app.validators).to.have.key ('isMongoIdOrMe')
              .that.is.a.function;

            expect (app.sanitizers).to.have.key ('customSanitizer')
              .that.is.a.function;

            return callback (null);
          }
        ], done);
      });
    });
  });

  describe ('#start', function () {
    it ('should start the application', function (done) {
      app.start (done);
    });
  });

  describe ('#addModule', function (done) {
    it ('should load an application module into the main application', function (done) {
      var modulePath = path.resolve (__dirname, '../fixtures/app-module');
      var appModule  = new ApplicationModule (modulePath);

      async.waterfall ([
        async.constant (appModule),

        function (module, callback) {
          module.init (callback);
        },
        function (module, callback) {
          app.addModule ('test-module', module, callback);
        },
        function (callback) {
          expect (app.modules).to.have.keys (['test-module']);

          // Check the policies are added to the application.
          expect (app.policies).to.have.keys (['module-policy', 'alwaysTrue', 'alwaysFalse']);

          // Check auto-setting of engines on application based on view extensions.
          expect (app._server._engines).to.have.length (3);
          expect (app._server._engines).to.deep.equal (['jade', 'mustache', 'pug']);

          // Check the views are copy to the view cache.
          var views = [
            path.join (appPath, 'temp', 'views', 'module.jade'),
            path.join (appPath, 'temp', 'views', 'second-level', 'module.jade')
          ];

          async.each (views, function (view, callback) {
            fs.stat (view, function (err, stat) {
              if (err) return callback (err);

              expect (stat.isFile()).to.be.true;
              return callback ();
            });
          }, done);
        }
      ], done);
    });
  });
});