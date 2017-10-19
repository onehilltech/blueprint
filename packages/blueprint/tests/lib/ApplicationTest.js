var expect = require ('chai').expect
  , path   = require ('path')
  , async  = require ('async')
  , fs     = require ('fs')
  , winston = require ('winston')
  ;

var Application = require ('../../lib/Application')
  , Barrier     = require ('../../lib/Barrier')
  , Messaging   = require ('../../lib/Messaging')
  , ApplicationModule = require ('../../lib/ApplicationModule')
  ;

describe ('Application', function () {
  const messaging = new Messaging ();
  const appPath = path.resolve (__dirname, '../fixtures/app');
  var app;

  before (function () {
    Barrier.removeAll ();
  });

  describe ('new Application ()', function () {
    it ('should create and initialize a new application', function () {
      app = new Application (appPath, messaging);
      expect (app).to.be.instanceof (ApplicationModule);
    });
  });

  describe ('#init', function () {
    it ('should initialize the application', function (done) {
      app.init (function (err, app) {
        if (err)
          return done (err);

        expect (app.server).to.not.be.undefined;
        expect (app.validators).to.have.key ('isMongoIdOrMe');
        expect (app.sanitizers).to.have.key ('customSanitizer');

        async.parallel ([
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
          }
        ], done);
      });
    });
  });

  describe ('#start', function () {
    after (function (done) {
      app.destroy (done);
    });

    it ('should start the application', function (done) {
      app.start (done);
    });
  });

  describe ('#addModule', function (done) {
    it ('should load an application module into the main application', function (done) {
      var modulePath = path.resolve (__dirname, '../fixtures/app-module');
      var appModule  = new ApplicationModule (modulePath, new Messaging ());

      async.waterfall ([
        function (callback) {
          appModule.init (callback);
        },
        function (module, callback) {
          app.addModule ('test-module', module, callback);
        },

        function (app, callback) {
          // Check the application resources.
          expect (app.policies).to.have.keys (['module-policy', 'alwaysTrue', 'alwaysFalse']);

          // Check the module resources
          expect (app).to.have.nested.property ('modules.test-module');
          expect (app).to.have.nested.property ('modules.test-module.controllers.ModuleTestController');
          expect (app).to.have.nested.property ('modules.test-module.policies.module-policy');
          expect (app).to.have.nested.property ('modules.test-module.routers.ModuleTest');

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
              if (err)
                return callback (err);

              expect (stat.isFile()).to.be.true;
              return callback (null);
            });
          }, callback);
        }
      ], done);
    }, done);
  });
});