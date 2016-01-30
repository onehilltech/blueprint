var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var blueprint = require ('../../../fixtures/blueprint')
  , datamodel = require ('../../../fixtures/datamodel')
  , Account   = blueprint.app.models.Account
  ;

describe ('MeRouter', function () {
  var server;
  var accessToken;
  var account;

  before(function (done) {
    async.series ([
      function (callback) {
        server = blueprint.app.server;
        callback ();
      },
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
          username: datamodel.rawModels.accounts[0].access_credentials.username,
          password: datamodel.rawModels.accounts[0].access_credentials.password,
          client_id: datamodel.models.clients[0].id
        };

        // Get an access token for all requests.
        request(server.app)
          .post('/oauth2/token').send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return callback(err);

            accessToken = res.body.access_token;

            return callback ();
        });
      }
    ], done);
  });

  describe ('GET /me/whoami', function () {
    it ('should return my user id', function (done) {
      request(server.app)
        .get ('/me/whoami')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body).to.have.keys (['_id']);
          expect (res.body._id).to.equal (datamodel.models.accounts[0].id);
          return done ();
      });
    });
  });

  describe ('GET /me/profile', function () {
    it ('should return my profile', function (done) {
      request(server.app)
        .get ('/me/profile')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body._id).to.equal (account.id);
          expect (res.body.email).to.equal (account.profile.email);

          return done ();
        });
    });
  });

  describe ('POST /me/profile/image', function () {
    it ('should upload my profile', function (done) {
      request(server.app)
        .post ('/me/profile/image')
        .set ('Authorization', 'Bearer ' + accessToken)
        .attach ('image', 'tests/data/avatar.png')
        .expect (200, function (err, res) {
          if (err) return done (err);

          expect (res.body).to.have.keys (['_id']);

          async.series ([
            function (callback) {
              // We should verify the account profile image field is updated.
              Account.findById (account.id, function (err, account) {
                if (err) return callback (err);

                var imageUrl = 'https://localhost/images/' + res.body._id;
                expect (account.profile.image).to.equal (imageUrl);

                return callback ();
              });
            },
            function (callback) {
              // We should verify the image is in the database. Since it is an
              // upload, the image is stored in GridFS portion of the database.
              var fileId = res.body._id;
              var gridfs = blueprint.app.database.gridfs;

              gridfs.findOne ({_id: fileId}, function (err, file) {
                if (err) return callback (err);

                expect (file.filename).to.equal ('avatar.png');
                expect (file.contentType).to.equal ('image/png');
                expect (file.length).to.be.above (0);

                return callback ();
              });
            }
          ], done);
        });
    });
  });

  describe ('POST /me/notifications', function () {
    it ('should update my notification token', function (done) {
      var token = '1234567890';
      var network = 'gcm';

      var data = {
        network : network,
        token : token
      };

      request(server.app)
        .post ('/me/notifications')
        .send (data)
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (200).expect ('true')
        .end (function (err, res) {
          if (err) return done (err);

          var accountId = datamodel.models.accounts[0].id;

          Account.findById (accountId, function (err, account) {
            if (err) return done (err);

            expect (account.notifications[network]).to.equal (token)
            return done ();
          });
      });
    });
  });
});