var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var datamodel  = require ('../../../fixtures/datamodel')
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
      // 1. apply the datamodel
      function (callback) {
        datamodel.apply (callback);
      },

      // 2. get the user token for the tests.
      function (callback) {
        server  = blueprint.app.server;
        CloudToken = blueprint.app.models.CloudToken;

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
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should post a new cloud token for user', function (done) {
      request (server.app)
        .post ('/v1/cloudtoken')
        .set ('Authorization', 'Bearer ' + userToken)
        .send (data)
        .expect (200, 'true', function (err) {
          if (err) return done (err);

          CloudToken.findOne ({device: data.device}, '-__v', function (err, cloudToken) {
            if (err) return done (err);
            if (!cloudToken) return done (new HttpError ('Token cannot be found'));

            cloudToken = cloudToken.toJSON ();
            cloudToken.owner = cloudToken.owner.toString ();

            expect (cloudToken).to.deep.equal ({
              _id: cloudToken._id,
              device: data.device,
              owner: datamodel.models.accounts[0].id,
              token: data.token
            });

            return done ();
          });
        });
    });
  });
});