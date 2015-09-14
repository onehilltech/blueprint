var blueprint = require ('blueprint')
  , request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../fixtures/datamodel')
  , Account    = blueprint.app.models.Account;
  ;

describe ('AccountController', function () {
  var server;
  var accessToken;

  before(function (done) {
    async.series ([
      function (callback) {
        server = blueprint.app.server;
        blueprint.app.database.connect(callback);
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

  describe ('POST /accounts/:accountId/apn', function () {
    it ('should update the token', function (done) {
      request(server.app)
        .post ('/accounts/' + datamodel.models.accounts[0].id +  '/apn')
        .set ('Authorization', 'Bearer ' + accessToken)
        .send ({network: 'gcm', token : '1234567890'})
        .expect ('true').expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          Account.findById (datamodel.models.accounts[0].id, function (err, account) {
            if (err) return done (err);

            expect (account.apn.gcm).to.equal ('1234567890');

            return done ();
          });
      });
    });
  });
});