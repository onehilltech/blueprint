var blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , request   = require ('supertest')
  , async     = require ('async')
  ;

var datamodel = require ('../../../../fixtures/datamodel')
  ;

describe ('ClientRouter', function () {
  var server;
  var accessToken;
  var client;

  before (function (done) {
    async.waterfall ([
      function (callback) {
        datamodel.apply (callback);
      },

      function (result, callback) {
        server = result[0].server;

        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: datamodel.models.clients[0].secret
        };

        request (server.app)
          .post ('/v1/oauth2/token')
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return callback (err);
            accessToken = res.body;
            return callback (null);
          });
      }
    ], done);

  });

  describe ('/v1/clients', function () {
    describe ('POST', function () {
      var data = {
        name: 'test-client',
        email: 'test-client@contact.me',
        secret: 'test-client'
      };

      it ('should create a client', function (done) {
        request (server.app)
          .post ('/v1/clients')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({client: data})
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            client = res.body.client;

            expect (res.body).to.eql ({
              client: {
                _id: client._id,
                name: data.name,
                secret: data.secret,
                email: data.email,
                roles: [],
                enabled: true
              }
            });

            return done (null);
          });
      });
    });
  });

  describe ('/v1/clients/:clientId', function () {
    describe ('PUT', function () {
      var data = {
        name: 'updated-name'
      };

      it ('should update the client', function (done) {
        request (server.app)
          .put ('/v1/clients/' + client._id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({client: data})
          .expect (200, {
            client: {
              _id: client._id,
              name: data.name,
              secret: client.secret,
              email: client.email,
              enabled: client.enabled,
              roles: client.roles
            }
          }, done);
      });
    });

    describe ('DELETE', function () {
      it ('should delete a client', function (done) {
        request (server.app)
          .delete ('/v1/clients/' + client._id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, 'true', done);
      });
    });
  });
});
