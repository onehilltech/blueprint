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

PasswordController.prototype.forgotPassword = function () {
  let controller = this;

  return {
    validate: {
      email: {
        in: 'body',
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
          Account.findOne ({email: req.body.email}, callback);
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
  let controller = this;

  return {
    validate: {
      'password-reset.token': {
        in: 'body',
        notEmpty: {
          errorMessage: 'The request is missing the token parameter.'
        }
      },
      'password-reset.password': {
        in: 'body',
        notEmpty: {
          errorMessage: 'The request is missing the password parameter.'
        }
      }
    },

    execute (req, res, callback) {
      let {token,password} = req.body['password-reset'];

      async.waterfall ([
        function (callback) {
          controller._tokenGenerator.verifyToken (token, callback);
        },

        function (payload, callback) {
          Account.findOne ({email: payload.email}, callback);
        },

        function (account, callback) {

        }
      ], callback);
    }
  }
};
