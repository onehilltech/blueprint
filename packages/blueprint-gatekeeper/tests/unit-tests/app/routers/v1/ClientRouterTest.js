'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  , ObjectId  = mongodb.Types.ObjectId
  , _         = require ('underscore')
  , async     = require ('async')
  ;

describe ('ClientRouter', function () {
  describe ('/v1/clients', function () {
    describe ('POST', function () {
      it ('should create a client', function (done) {
        const client = {_id: new ObjectId (), type: 'native', name: 'test-client', email: 'test-client@contact.me', client_secret: 'test-client'};
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .post ('/v1/clients')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({client: client})
          .expect (200, {client: mongodb.lean (_.extend (client, {enabled: true, scope: []}))}, done);
      });
    });
  });

  describe ('/v1/clients/:clientId', function () {
    describe ('PUT', function () {
      it ('should update the client', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const client = blueprint.app.seeds.$default.native[0];
        const update = {name: 'updated-name'};

        blueprint.testing.request ()
          .put ('/v1/clients/' + client.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({client: update})
          .expect (200, {client: _.extend (client.lean (), update)}, done);
      });
    });

    describe ('DELETE', function () {
      it ('should delete a client', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const client = blueprint.app.seeds.$default.native[0];

        blueprint.testing.request ()
          .delete ('/v1/clients/' + client.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, 'true', done);
      });
    });
  });
});
