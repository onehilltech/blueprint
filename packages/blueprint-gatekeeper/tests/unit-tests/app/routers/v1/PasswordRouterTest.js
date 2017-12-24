const {expect} = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const async = require ('async');
const ResetPasswordTokenGenerator = require ('../../../../../app/utils/reset-password-token-generator');

describe ('app | routers | password', function () {
  describe ('/password/reset', function () {
    describe ('GET', function () {
      let tokenGenerator;

      before (function () {
        tokenGenerator = new ResetPasswordTokenGenerator ();
      });

      it ('should generate an email', function (done) {
        let account = blueprint.app.seeds.$default.accounts[0];

        blueprint.messaging.once ('gatekeeper.password.reset', (acc, token) => {
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
          .get ('/v1/password/reset')
          .query ({email: account.email})
          .expect (200, 'true').end (function (err) {
            if (err) return done (err);
        });
      });
    });
  });
});
