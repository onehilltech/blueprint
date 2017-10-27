'use strict';

const async      = require ('async')
  , blueprint    = require ('@onehilltech/blueprint')
  , verification = require ('../../../../../app/utils/account-verification')
  ;

describe ('router:VerificationRouter', function () {
  describe ('/v1/verify', function () {
    context ('no redirection', function () {
      it ('should verify an account', function (done) {
        let account = blueprint.app.seeds.$default.accounts[0];

        async.waterfall ([
          (callback) => {
            verification.generateToken (account, callback);
          },

          (token, callback) => {
            blueprint.testing.request ()
              .get (`/v1/verify?token=${token}`)
              .expect (200, callback);
          }
        ], done);
      });
    });

    context ('redirection', function () {
      it ('should verify an account', function (done) {
        let account = blueprint.app.seeds.$default.accounts[0];

        async.waterfall ([
          (callback) => {
            verification.generateToken (account, callback);
          },

          (token, callback) => {
            blueprint.testing.request ()
              .get (`/v1/verify?token=${token}&redirect=http://localhost:5000/verify`)
              .expect (302, (err, res) => {
                callback (err, res);
              });
          }
        ], done);
      });
    });
  });
});
