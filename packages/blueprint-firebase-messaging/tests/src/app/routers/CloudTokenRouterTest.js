var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var datamodel  = require ('../../../fixtures/datamodel')
  , appFixture = require ('../../../fixtures/app')
  , bm = blueprint.messaging
  ;

describe ('CloudTokenRouter', function () {
  var server;
  var userToken;
  var CloudToken;

  function getToken (data, callback) {
    request (server.app)
      .post ('/gatekeeper/v1/oauth2/token').send (data)
      .expect (200)
      .end (function (err, res) {
        if (err) return callback (err);
        return callback (null, res.body.access_token);
      });
  }

  before (function (done) {
    async.series ([
      function (callback) {
        appFixture (function (err, app) {
          if (err) return callback (err);

          server  = app.server;
          CloudToken = app.models.CloudToken;

          return callback (null);
        });
      },

      // 1. apply the datamodel
      function (callback) {
        datamodel.apply (callback);
      },

      // 2. get the user token for the tests.
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          userToken = token;
          return callback ();
        });
      }
    ], done);
  });

  describe ('POST /v1/cloudtoken', function () {
    var data = {network: 'gcm', token: '1234567890'};

    it ('should post a new cloud token for user', function (done) {
      request (server.app)
        .post ('/v1/cloudtoken')
        .set ('Authorization', 'Bearer ' + userToken)
        .send (data)
        .expect (200, 'true', function (err) {
          if (err) return done (err);

          CloudToken.findById (datamodel.models.accounts[0]._id, function (err, cloudToken) {
            if (err) return done (err);

            expect (cloudToken.gcm).to.equal (data.token);

            return done ();
          });
        });
    });
  });
});