'use strict';

var expect    = require ('chai').expect
  , async     = require ('async')
  , jwt       = require ('jsonwebtoken')
  , blueprint = require ('@onehilltech/blueprint')
  ;

describe ('CloudTokenRouter', function () {
  describe ('/v1/cloud-tokens', function () {
    describe ('POST', function () {
      it ('should register an unclaimed cloud token', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const data = {device: '1234567890', token: 'aabbccdd'};

        async.waterfall ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/cloud-tokens')
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .send (data)
              .expect (200, callback);
          },

          function (res, callback) {
            expect (res.body).to.have.deep.property ('claim_ticket.claim_ticket');

            async.waterfall ([
              function (callback) {
                let claimTicketOptions = blueprint.app.configs['cloud-messaging'].claimTicketOptions;
                let options = {issuer: 'cloud-messaging', audience: 'user', subject: 'claim-ticket'};
                let cert = claimTicketOptions.secret || claimTicketOptions.publicKey;

                jwt.verify (res.body.claim_ticket.claim_ticket, cert, options, callback);
              },

              function (payload, callback) {
                expect (payload).to.have.keys (['aud', 'jti', 'iat', 'iss', 'sub']);

                blueprint.app.models.CloudToken.findById (payload.jti, callback);
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
              .expect (200, {}, callback);
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

  describe ('/v1/cloud-tokens/:deviceId/claim', function () {
    describe ('POST', function () {
      it ('should claim an unclaimed device', function (done) {
        let userToken = blueprint.app.seeds.$default.user_tokens[0];
        let accessToken = userToken.serializeSync ();
        let deviceId = 'device_123';

        async.waterfall ([
          function (callback) {
            let cloudToken = blueprint.app.seeds.$default.cloud_tokens[0];
            let claimTicketOptions = blueprint.app.configs['cloud-messaging'].claimTicketOptions;
            let options = {jwtid: cloudToken.id, issuer: 'cloud-messaging', audience: 'user', subject: 'claim-ticket'};
            let cert = claimTicketOptions.secret || claimTicketOptions.privateKey;

            jwt.sign ({}, cert, options, callback);
          },

          function (claimTicket, callback) {
            // generate the expected token for the first device, and submit the
            // claim ticket.

            blueprint.testing.request ()
              .post ('/v1/cloud-tokens/device_123/claim')
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .send ({claim_ticket: claimTicket})
              .expect (200, 'true', callback);
          },

          function (res, callback) {
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

      it ('should not allow client to claim a device', function (done) {
        let clientToken = blueprint.app.seeds.$default.client_tokens[0];
        let accessToken = clientToken.serializeSync ();

        blueprint.testing.request ()
          .post ('/v1/cloud-tokens/device_123/claim')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({claim_ticket: '1234567890'})
          .expect (403, {errors: {code: 'policy_failed', message: 'Not a user token'}}, done);
      });
    });

    describe ('DELETE', function () {
      it ('should release a claimed device', function (done) {
        let accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
        let cloudToken = blueprint.app.seeds.$default.cloud_tokens[3];

        blueprint.testing.request ()
          .delete (`/v1/cloud-tokens/${cloudToken.device}/claim`)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, 'true', done);
      });

      it ('should delete a claim device', function (done) {
        let accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
        let cloudToken = blueprint.app.seeds.$default.cloud_tokens[4];

        blueprint.testing.request ()
          .delete (`/v1/cloud-tokens/${cloudToken.device}/claim`)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (404, {errors: {code: 'not_found', message: 'Device registration does not exist.'}}, done);
      });
    });
  });

});