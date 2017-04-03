'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , getToken  = require ('../../../getToken')
  ;

describe ('ClientRouter', function () {
  var accessToken;
  var client;

  before (function (done) {
    var data = {
      grant_type: 'client_credentials',
      client_id: blueprint.app.seeds.$default.clients[0].id,
      client_secret: blueprint.app.seeds.$default.clients[0].secret
    };

    getToken (data, function (err, result) {
      if (err)
        return done (err);

      accessToken = result;

      return done (null);
    });
  });

  describe ('/v1/clients', function () {
    describe ('POST', function () {
      var data = {name: 'test-client', email: 'test-client@contact.me', secret: 'test-client' };

      it ('should create a client', function (done) {
        blueprint.testing.request ()
          .post ('/v1/clients')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({client: data})
          .expect (200)
          .end (function (err, res) {
            if (err)
              return done (err);

            client = res.body.client;

            expect (res.body).to.eql ({
              client: {
                _id: client._id,
                name: data.name,
                secret: data.secret,
                email: data.email,
                scope: [],
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
      var data = {name: 'updated-name'};

      it ('should update the client', function (done) {
        blueprint.testing.request ()
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
              scope: client.scope
            }
          }, done);
      });
    });

    describe ('DELETE', function () {
      it ('should delete a client', function (done) {
        blueprint.testing.request ()
          .delete ('/v1/clients/' + client._id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, 'true', done);
      });
    });
  });
});
