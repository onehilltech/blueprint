var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , async     = require ('async')
  , HttpError = blueprint.errors.HttpError
  , gatekeeper = require ('../../lib')
  ;

var Account = require ('../models/Account')
  ;

module.exports = ActivationController;

function ActivationController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (ActivationController);

var tokenStrategy;

messaging.on ('app.init', function (app) {
  var gatekeeperConfig = app.configs.gatekeeper;
  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

/**
 * Activate an account.
 */
ActivationController.prototype.activate = function () {
  return {
    validate: {
      token: {
        in: 'query',
        notEmpty: {
          errorMessage: 'Missing activation token'
        }
      }
    },

    execute: function (req, res, callback) {
      async.waterfall ([
        async.constant (req.query.token),

        function (token, callback) {
          var opts = {};
          tokenStrategy.verifyToken (token, opts, callback);
        },

        function (payload, callback) {
          var filter = {email: payload.email, username: payload.username};

          Account.findOne (filter, function (err, account) {
            if (err) return callback (new HttpError (400, 'activation_failed', 'Failed to activate account'));
            if (!account) return callback (new HttpError (400, 'invalid_account', 'Account does not exist'));
            if (account.isActivated ()) return callback (new HttpError (400, 'account_activated', 'Account already activated'));

            account.activation.date = Date.now ();
            account.save (callback);
          });
        }
      ], function (err) {
        if (err) return callback (err);
        return res.status (200).json (true);
      });
    }
  };
};
