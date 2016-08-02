var request = require ('supertest')
  , path    = require ('path')
  , async   = require ('async')
  , expect  = require ('chai').expect
  ;

var appFixture = require ('../fixtures/app')
  ;

describe ('GridFSController', function () {
  var server;
  var imageId;

  before (function (done) {
    async.waterfall ([
      function (callback) { appFixture (callback); },
      function (app, callback) {
        server = app.server;

        var collections = ['image.files', 'image.chunks'];
        async.each (collections, function (coll, callback) {
          app.database.conn.db.collection (coll).drop (function (err) {
            if (err && err.code === 26) err = null;
            return callback (err);
          });
        }, callback);
      }
    ], done);
  });

  describe ('POST (i.e., create)', function () {
    it ('should upload file, and store in database', function (done) {
      var imageFile = path.resolve (__dirname, '../data/avatar1.png');

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

  describe ('PUT (i.e., update)', function () {
    it ('should not update the image', function (done) {
      var imageFile = path.resolve (__dirname, '../data/avatar2.png');

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