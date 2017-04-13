'use strict';

var expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

describe ('CloudTokenRouter', function () {
  describe ('POST /v1/cloud-tokens', function () {
    it ('should post a new cloud token for user', function (done) {
      const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
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
              expect (cloudToken).to.be.defined;

              expect (cloudToken.lean ()).to.deep.equal ({
                _id: cloudToken.id,
                device: data.device,
                owner: blueprint.app.seeds.$default.accounts[0].id,
                token: data.token
              });

              return callback (null);
            }
          ], callback);
        }
      ], done);
    });
  });
});