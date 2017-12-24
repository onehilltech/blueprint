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

          messaging.emit ('gatekeeper.password.forgot', account);
          res.status (200).json (true);

          return callback (null);
        }
      ], callback);
    }
  };
};

PasswordController.prototype.resetPassword = function () {
  let controller = this;

  return {
    validate: {
      'reset-password.token': {
        in: 'body',
        notEmpty: {
          errorMessage: 'The request is missing the token parameter.'
        }
      },
      'reset-password.password': {
        in: 'body',
        notEmpty: {
          errorMessage: 'The request is missing the password parameter.'
        }
      }
    },

    execute (req, res, callback) {
      let {token,password} = req.body['reset-password'];

      async.waterfall ([
        function (callback) {
          controller._tokenGenerator.verifyToken (token, {}, callback);
        },

        function (payload, callback) {
          Account.findOne ({email: payload.email}, callback);
        },

        function (account, callback) {
          account.password = password;
          account.save (callback);
        },

        function (account, n, callback) {
          messaging.emit ('gatekeeper.password.reset', account);

          res.status (200).json (true);
          return callback (null);
        }
      ], callback);
    }
  }
};
