var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.errors.HttpError
  ;

var Account = require ('../models/Account')
  ;

function ActivationController () {

}

blueprint.controller (ActivationController);

/**
 * Activate an account.
 *
 * @returns {Function}
 */
ActivationController.prototype.activateAccount = function () {
  return {
    validate: function (req, callback) {
      req.checkQuery ('account').notEmpty ().isMongoId ();
      req.checkQuery ('token').notEmpty ();

      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var accountId = req.query.account;
      var token = req.query.token;

      // Find the account, and then activate the account. We perform the logic
      // programmatically so we can gain fine control over what to render to
      // the client.

      Account.findById (accountId, function (err, account) {
        if (err)
          return callback (new HttpError (400, 'Failed to activate account'));

        if (!account)
          return callback (new HttpError (400, 'Account does not exist'));

        // First, check if the token is a match. If the token is a match, then we need
        // to check if the account has been activated or the token has expired before
        // continuing on with the activation process.
        if (account.activation.token.value !== token)
          return callback (new HttpError (404, 'Failed to activate account'));

        if (account.isVerified ())
          return res.render ('gatekeeper-account-activation', { status: 'error', message : 'Account already activated'} );

        if (account.isVerificationTokenExpired ())
          return res.render ('gatekeeper-account-activation', { status: 'error', message : 'Activation token has expired' } );

        account.verify (function (err, account) {
          if (err)
            return callback (new HttpError (500, 'Failed to activate account'));

          return res.render ('gatekeeper-account-activation', { status: 'info', message : 'Congrats! Your account has been activated' });
        });
      });
    }
  };
};

module.exports = exports = ActivationController;
