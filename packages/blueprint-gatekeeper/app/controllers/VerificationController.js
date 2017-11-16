const blueprint  = require ('@onehilltech/blueprint')
  , async        = require ('async')
  , verification = require ('../utils/account-verification')
  ;

module.exports = VerificationController;

function VerificationController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (VerificationController);

VerificationController.prototype.__invoke = function () {

  return {
    validate: {
      token: {
        in: 'query',
        notEmpty: {
          errorMessage: 'Missing verification token'
        }
      },

      redirect: {
        in: 'query',
        optional: true,
        isURL: {
          options: [{require_tld: blueprint.env === 'production'}]
        },
      }
    },

    execute: function (req, res, callback) {
      async.waterfall ([
        function (callback) {
          verification.verifyToken (req.query.token, callback);
        },

        function (account, n, callback) {
          if (req.query.redirect) {
            let code = n === 1 ? 'success' : 'verify_failed';

            res.redirect (`${req.query.redirect}?email=${encodeURIComponent (account.email)}&code=${code}`);
          }
          else {
            let verified = n === 1;

            let data = {
              email: account.email,
              message: verified ? `You have successfully verified the account for ${account.email}.` : `You failed to verify the account for ${account.email}.`
            };

            res.status (200).render ('gatekeeper-account-verification.pug', data);
          }

          return callback (null);
        }
      ], callback);
    }
  };
};
