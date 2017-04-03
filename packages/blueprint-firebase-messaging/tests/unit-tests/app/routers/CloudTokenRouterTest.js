'use strict';

var expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

function getToken (data, callback) {
  blueprint.testing.request ()
    .post ('/gatekeeper/v1/oauth2/token')
    .send (data)
    .expect (200)
    .end (function (err, res) {
      if (err)
        return callback (err);

      return callback (null, res.body.access_token);
    });
}

describe ('CloudTokenRouter', function () {
  var userToken;

  before (function (done) {

    var data = {
      grant_type: 'password',
      username: blueprint.app.seeds.$default.accounts[0].username,
      password: blueprint.app.seeds.$default.accounts[0].username,
      client_id: blueprint.app.seeds.$default.clients[0].id
    };

    getToken (data, function (err, token) {
      if (err)
        return done (err);

      userToken = token;
      return done (null);
    });
  });

  describe ('POST /v1/cloud-tokens', function () {
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should post a new cloud token for user', function (done) {
      blueprint.testing.request ()
        .post ('/v1/cloud-tokens')
        .set ('Authorization', 'Bearer ' + userToken)
        .send (data)
        .expect (200, 'true', function (err) {
          if (err) return done (err);

          blueprint.app.models.CloudToken.findOne ({device: data.device}, function (err, cloudToken) {
            if (err)
              return done (err);

            if (!cloudToken)
              return done (new HttpError ('Token cannot be found'));

            cloudToken = cloudToken.toObject ();
            cloudToken.owner = cloudToken.owner.toString ();

            expect (cloudToken).to.deep.equal ({
              _id: cloudToken._id,
              device: data.device,
              owner: blueprint.app.seeds.$default.accounts[0].id,
              token: data.token
            });

            return done ();
          });
        });
    });
  });
});