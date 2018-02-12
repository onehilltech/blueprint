const {expect}  = require ('chai');
const async     = require ('async');
const blueprint = require ('@onehilltech/blueprint');
const FirebaseDevice = require ('../../../../../app/models/firebase-device');

describe ('app | routers | v1 | FirebaseMessagingRouter', function () {
  describe ('/v1/firebase/devices', function () {
    describe ('POST', function () {
      it ('should register a device', function (done) {
        const device = {device: '1234567890'};

        async.waterfall ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/firebase/devices')
              .withClientToken (0)
              .send ({device})
              .expect (200).end (callback);
          },

          function (res, callback) {
            expect (res.body).to.have.deep.property ('device.device_token');

            return callback (null);
          }
        ], done);
      });

      it ('should register a device with token', function (done) {
        let device = {device: '0987654321', token: 'aabbccdd'};

        async.waterfall ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/firebase/devices')
              .withClientToken (0)
              .send ({device})
              .expect (200, callback);
          },

          function (res, callback) {
            async.waterfall ([
              function (callback) {
                FirebaseDevice.findOne ({device: device.device}, callback);
              },

              function (model, callback) {
                expect (res.body.device).to.eql (model.lean ());
                return callback (null);
              }
            ], callback);
          }
        ], done);


      });
    });

    describe ('DELETE', function () {
      it ('should remove a device', function (done) {
        const device = blueprint.app.seeds.$default.devices[0];

        blueprint.testing.request ()
          .delete ('/v1/firebase/devices')
          .set ('Authorization', `Bearer ${device.device_token}`)
          .expect (200, 'true', done);
      });

      it ('should not permit double removal of device', function (done) {
        const device = blueprint.app.seeds.$default.devices[0];

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .delete ('/v1/firebase/devices')
              .set ('Authorization', `Bearer ${device.device_token}`)
              .expect (200, 'true', callback);
          },

          function (callback) {
            blueprint.testing.request ()
              .delete ('/v1/firebase/devices')
              .set ('Authorization', `Bearer ${device.device_token}`)
              .expect (403, { errors:
                  [ { code: 'policy_failed',
                    detail: 'The device for the request does not exist.',
                    status: '403' } ] }, callback);
          }
        ], done);
      })
    });
  });

  describe ('/v1/firebase/devices/tokens', function () {
    describe ('POST', function () {
      it ('should initialize the device token', function (done) {
        const device = blueprint.app.seeds.$default.devices[3];

        const expected = device.lean ();
        expected.token = 'abc';

        blueprint.testing.request ()
          .post ('/v1/firebase/devices/tokens')
          .send ({device: {token: 'abc'}})
          .set ('Authorization', `Bearer ${device.device_token}`)
          .expect (200, {device: expected}, done);
      });

      it ('should refresh the existing device token', function (done) {
        const device = blueprint.app.seeds.$default.devices[0];

        const expected = device.lean ();
        expected.token = 'abc';

        blueprint.testing.request ()
          .post ('/v1/firebase/devices/tokens')
          .send ({device: {token: 'abc'}})
          .set ('Authorization', `Bearer ${device.device_token}`)
          .expect (200, {device: expected}, done);
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
          .expect (403, {errors: [{status: '403', code: 'policy_failed', detail: 'Not a user token'}] }, done);
      });
    });
  });
});