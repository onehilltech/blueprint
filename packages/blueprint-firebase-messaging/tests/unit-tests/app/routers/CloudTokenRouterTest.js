'use strict';

var expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

describe ('CloudTokenRouter', function () {
  describe ('/v1/cloud-tokens', function () {
    describe ('POST', function () {
      it ('should register an unclaimed cloud token', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const data = {device: '1234567890', token: 'aabbccdd'};

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/cloud-tokens')
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .send (data)
              .expect (200, 'true', callback);
          },

          function (callback) {
            async.waterfall ([
              function (callback) {
                blueprint.app.models.CloudToken.findOne ({device: data.device}, callback);
              },

              function (cloudToken, callback) {
                expect (cloudToken.lean ()).to.deep.equal ({
                  _id: cloudToken.id,
                  device: data.device,
                  token: data.token
                });

                return callback (null);
              }
            ], callback);
          }
        ], done);
      });

      it ('should register an claimed cloud token', function (done) {
        let userToken = blueprint.app.seeds.$default.user_tokens[0];
        let accessToken = userToken.serializeSync ();
        let data = {device: '0987654321', token: 'aabbccdd'};

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/cloud-tokens')
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .send (data)
              .expect (200, 'true', callback);
          },

          function (callback) {
            async.waterfall ([
              function (callback) {
                blueprint.app.models.CloudToken.findOne ({device: data.device}, callback);
              },

              function (cloudToken, callback) {
                expect (cloudToken.lean ()).to.deep.equal ({
                  _id: cloudToken.id,
                  device: data.device,
                  token: data.token,
                  owner: userToken.account.toString ()
                });

                return callback (null);
              }
            ], callback);
          }
        ], done);
      });
    });
  });

  describe ('/v1/cloud-tokens/:deviceId', function () {
    describe ('PUT', function () {
      it ('should claim an unclaimed token', function (done) {
        let userToken = blueprint.app.seeds.$default.user_tokens[0];
        let accessToken = userToken.serializeSync ();
        let deviceId = 'device_123';

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .put (`/v1/cloud-tokens/${deviceId}`)
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .expect (200, 'true', callback);
          },

          function (callback) {
            async.waterfall ([
              function (callback) {
                blueprint.app.models.CloudToken.findOne ({device: deviceId}, callback);
              },

              function (cloudToken, callback) {
                expect (cloudToken.lean ()).to.deep.equal ({
                  _id: cloudToken.id,
                  device: deviceId,
                  token: cloudToken.token,
                  owner: userToken.account.toString ()
                });

                return callback (null);
              }
            ], callback);
          }
        ], done);
      });
    });
  });

});