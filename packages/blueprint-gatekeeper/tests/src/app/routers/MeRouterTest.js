var xpression = require ('xpression')
  , request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../fixtures/datamodel')
  , Account    = xpression.app.models.Account;
  ;

describe ('MeRouter', function () {
  var server;
  var accessToken;

  before(function (done) {
    async.series ([
      function (callback) {
        server = xpression.app.server;
        xpression.app.database.connect(callback);
      },
      function (callback) {
        datamodel.apply (callback);
      },
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.rawModels.accounts[0].username,
          password: datamodel.rawModels.accounts[0].password,
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