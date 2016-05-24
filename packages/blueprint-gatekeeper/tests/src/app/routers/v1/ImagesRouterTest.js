var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var blueprint = require ('../../../../fixtures/blueprint')
  , datamodel = require ('../../../../fixtures/datamodel')
  ;

describe ('ImagesRouter', function () {
  var server;
  var accessToken;
  var account;
  var imageId;

  before(function (done) {
    server = blueprint.app.server;

    async.series ([
      function (callback) {
        datamodel.apply (function (err) {
          if (err) return callback (err);
          account = datamodel.models.accounts[0];
          return callback ();
        });
      },
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].access_credentials.username,
          password: datamodel.data.accounts[0].access_credentials.password,
          client_id: datamodel.models.clients[0].id
        };

        // Get an access token for all requests.
        request(server.app)
          .post('/v1/oauth2/token').send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return callback(err);
            accessToken = res.body.access_token;

            return callback ();
        });
      },
      function (callback) {
        // Add an image to the database.
        var options = {
          path : 'tests/data/avatar.png',
          mimetype : 'image/png',
          originalname : 'avatar.png'
        };

        var gridfs = blueprint.app.database.gridfs;
        gridfs.writeFileToDatabase (options, function (file) {
          imageId = file._id;
          return callback ();
        });
      }
    ], done);
  });

  describe ('GET /images/:imageId', function () {
    it ('should return an image from the database', function (done) {
      request(server.app)
        .get ('/v1/images/' + imageId)
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect ('Content-Type', 'image/png')
        .expect (200, done);
    });
  });
});