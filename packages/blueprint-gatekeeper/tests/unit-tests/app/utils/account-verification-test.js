'use strict';

const async      = require ('async')
  , expect       = require ('chai').expect
  , blueprint    = require ('@onehilltech/blueprint')
  , verification = require ('../../../../app/utils/account-verification')
  ;

describe ('utils:account-verification', function () {
  describe ('generateToken', function () {
    it ('should generate verification token, and verify account', function (done) {
      let account = blueprint.app.seeds.$default.accounts[0];

      async.waterfall ([
        function (callback) {
          verification.generateToken (account, callback);
        },

        function (token, callback) {
          verification.verifyToken (token, callback);
        },

        function (account, n, callback) {
          expect (account.id).to.equal (account.id);
          expect (account.verified_at).to.not.be.undefined;
          expect (n).to.equal (1);

          return callback (null);
        }
      ], done);
    });
  });

  describe ('verifyToken', function () {

  });
});
