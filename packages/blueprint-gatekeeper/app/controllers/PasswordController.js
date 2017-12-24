const blueprint  = require ('@onehilltech/blueprint');
const {messaging} = blueprint;
const HttpError = blueprint.errors.HttpError;
const async = require ('async');
const Account = require ('../models/Account');
const ResetPasswordTokenGenerator = require ('../utils/reset-password-token-generator');

module.exports = PasswordController;

function PasswordController () {
  blueprint.BaseController.call (this);

  this._tokenGenerator = new ResetPasswordTokenGenerator ();
}

blueprint.controller (PasswordController);

PasswordController.prototype.getResetPasswordLink = function () {
  let controller = this;

  return {
    validate: {
      email: {
        in: 'query',
        notEmpty: {
          errorMessage: 'The request is missing the email parameter.'
        },
        isEmail: {
          errorMessage: 'The provide email address is not valid.'
        }
      }
    },

    execute (req, res, callback) {
      async.waterfall ([
        function (callback) {
          Account.findOne ({email: req.query.email}, callback);
        },

        function (account, callback) {
          if (!account)
            return callback (new HttpError (400, 'unknown_email', 'The email address does not exist.'));

          async.waterfall ([
            function (callback) {
              let payload = {email: account.email};
              let options = {expiresIn: '5m'};

              controller._tokenGenerator.generateToken (payload, options, callback);
            },

            function (token) {
              messaging.emit ('gatekeeper.password.reset', account, token);
              res.status (200).json (true);
            }
          ], callback);
        }
      ], callback);
    }
  };
};

PasswordController.prototype.resetPassword = function () {
  return {
    validate: {
      'token': {

      },
      'password': {

      }
    },

    execute (req, res, callback) {

    }
  }
};
