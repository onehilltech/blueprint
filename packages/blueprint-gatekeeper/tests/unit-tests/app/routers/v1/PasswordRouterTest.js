const {expect} = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const async = require ('async');
const ResetPasswordTokenGenerator = require ('../../../../../app/utils/reset-password-token-generator');

describe ('app | routers | password', function () {
  let tokenGenerator;

  before (function () {
    tokenGenerator = new ResetPasswordTokenGenerator ();
  });

  describe ('/v1/password/forgot', function () {
    describe ('POST', function () {
      it ('should initiate forgot password sequence', function (done) {
        let account = blueprint.app.seeds.$default.accounts[0];

        blueprint.messaging.once ('gatekeeper.password.forgot', (acc, token) => {
          expect (acc.id).to.equal (account.id);

          async.waterfall ([
            function (callback) {
              tokenGenerator.verifyToken (token, {}, callback);
            },

            function (payload, callback) {
              expect (payload).to.include ({iss: 'gatekeeper', sub: 'gatekeeper.password.reset', email: acc.email});

              return callback (null);
            }
          ], done);
        });

        blueprint.testing.request ()
          .post ('/v1/password/forgot')
          .send ({email: account.email})
          .expect (200, 'true').end (function (err) {
            if (err) return done (err);
        });
      });
    });
  });

  describe ('/v1/password/reset', function () {
    describe ('POST', function () {
      it ('should reset the account password', function (done) {
        let account = blueprint.app.seeds.$default.accounts[0];

        async.waterfall ([

        ], done);
      });
    });
  });
});
