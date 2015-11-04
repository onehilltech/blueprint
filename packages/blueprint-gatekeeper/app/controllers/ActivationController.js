var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
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
  var self = this;

  return function (req, res) {
    var accountId = req.query.account;
    var token = req.query.token;

    // Find the account, and then activate the account. We perform the logic
    // programmatically so we can gain fine control over what to render to
    // the client.

    Account.findById (accountId, function (err, account) {
      if (err)
        return self.handleError (err, res, 400, 'Failed to activate account');

      if (!account)
        return self.handleError (err, res, 400, 'Account does not exist');

      // First, check if the token is a match. If the token is a match, then we need
      // to check if the account has been activated or the token has expired before
      // continuing on with the activation process.
      if (account.activation.token.value !== token)
        return self.handleError (err, res, 404, 'Failed to activate account');

      if (account.isActivated ())
        return res.render ('gatekeeper-account-activation', { status: 'error', message : 'Account already activated'} );

      if (account.activationTokenExpired ())
        return res.render ('gatekeeper-account-activation', { status: 'error', message : 'Activation token has expired' } );

      account.activate (function (err, account) {
        if (err)
          return self.handleError (err, res, 500, 'Failed to activate account');

        return res.render ('gatekeeper-account-activation', { status: 'info', message : 'Congrats! Your account has been activated' });
      });
    });
  };
};

module.exports = ActivationController;
