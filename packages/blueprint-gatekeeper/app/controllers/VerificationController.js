const blueprint  = require ('@onehilltech/blueprint')
  , async        = require ('async')
  , HttpError    = blueprint.errors.HttpError
  , Account      = require ('../models/Account')
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
      }
    },

    execute: function (req, res, callback) {
      async.waterfall ([
        function (callback) {
          verification.verifyToken (req.query.token, callback);
        },

        function (account, n, callback) {
          res.status (200).json (n === 1);
          return callback (null);
        }
      ], callback);
    }
  };
};
