var request           = require ('supertest')
  , blueprint         = require ('@onehilltech/blueprint')
  , path              = require ('path')
  , async             = require ('async')
  , expect            = require ('chai').expect
  , ConnectionManager = require ('../../../lib/ConnectionManager')
  ;

var appPath = path.resolve (__dirname, '../../fixtures/app');

describe ('GridFSController', function () {
  var server;
  var imageId;
  var defaultConnection;

  before (function (done) {
    async.waterfall ([
      function (callback) {
        blueprint.testing.createApplicationAndStart (appPath, callback);
      },

      function (app, callback) {
        // Make sure the default connection is open.
        server = app.server;
        defaultConnection = ConnectionManager.getConnectionManager ().defaultConnection;
        var connstr = app.configs.mongodb.connections.$default.connstr;

        defaultConnection.open (connstr, callback);
      }
    ], done);
  });

  describe ('/images', function () {
    describe ('POST', function () {
      it ('should upload file, and store in database', function (done) {
        var imageFile = path.resolve (__dirname, '../../data/avatar1.png');

        request (server.app)
          .post ('/images')
          .attach ('image', imageFile)
          .expect (200, function (err, res) {
            if (err) return done (err);

            expect (res.body).to.have.keys (['_id']);
            imageId = res.body._id;

            return done ();
          });
      });
    });
  });

  describe ('/images/:imageId', function () {
    describe ('GET', function () {
      it ('should get the image from the database', function (done) {
        request (server.app)
          .get ('/images/' + imageId)
          .expect (200, function (err, res) {
            if (err) return done (err);

            expect (res.type).to.equal ('image/png');

            return done ();
          });
      });

      it ('should not find the image', function (done) {
        request (server.app)
          .get ('/images/5')
          .expect (404, done);
      });

      it ('does not support querying for resource', function (done) {
        request (server.app)
          .get ('/images?filename=avatar1.png')
          .expect (404, done);
      })
    });

    describe ('PUT', function () {
      it ('should not update the image', function (done) {
        var imageFile = path.resolve (__dirname, '../../data/avatar2.png');

        request (server.app)
          .put ('/images/' + imageId)
          .attach ('image', imageFile)
          .expect (404, done);
      });
    });

    describe ('DELETE', function () {
      it ('should delete the image from the database', function (done) {
        request (server.app)
          .delete ('/images/' + imageId)
          .expect (200, 'true', done);
      });

      it ('should not delete the image again', function (done) {
        request (server.app)
          .delete ('/images/' + imageId)
          .expect (500, done);
      });
    });
  });
});