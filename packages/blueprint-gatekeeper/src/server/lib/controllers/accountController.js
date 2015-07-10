var winston = require ('winston')
  , util    = require ('util')
  , uid     = require ('uid-safe')
  , http    = require ('http')
  ;

var Account  = require ('../models/account')
  ;

const SECRET_LENGTH=48;

function AccountController (opts) {
  this._opts = opts || {};

  var adminOpts = this._opts.admin || {};
  this._clientId = adminOpts.clientId;
  this._clientSecret = adminOpts.clientSecret;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api methods

AccountController.prototype.lookupAccountParam = function () {
  return function (req, res, next, account_id) {
    winston.info ('searching for account ' + account_id);

    Account.findById (account_id, function (err, account) {
      if (err)
        return next (err);

      if (!account)
        return next (new Error ('Account does not exist'))

      req.account = account;
      next ();
    });
  };
}

AccountController.prototype.deleteAccount = function () {
  return function (req, res) {
    if (!req.account)
      return res.status (404).send ();

    var account = req.account;
    account.remove (function (err) {
      return res.send (200, err ? false : true);
    });
  };
}

AccountController.prototype.enableAccount = function () {
  return function (req, res) {
    req.checkBody ('enabled', 'enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return res.send (200, 'false');

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    // Update the client, and save it.
    var account = req.account;
    account.enabled = req.body.enabled;

    account.save (function (err) {
      if (err)
        winston.error (err);

      res.send (200, err ? false : true);
    });
  };
}

AccountController.prototype.updateScope = function () {
  return function (req, res) {
    if (!req.account)
      return res.status (404).send ();

    var account = req.account;
    account.scope = req.body.scope;
    account.save (function (err) {
      return res.send (200, err ? false : true);
    });
  };
};

AccountController.prototype.createAccount = function () {
  return function (req, res) {
    var account = new Account ({
      username : req.body.username,
      password : req.body.password,
      email    : req.body.email
    });

    account.save (function (err) {
      return res.send (200, err ? false : true);
    });
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// admin methods

AccountController.prototype.viewAccounts = function () {
  return function (req, res) {
    // Use the API to get the accounts. This will ensure the client accessing
    // the accounts has been granted access.
    var path = 'http://' + req.headers.host + '/api/accounts';
    var options = {
      path : 'http://' + req.headers.host + '/api/accounts'
    };

    console.log (options);

    http.get (path, function (res) {
      winston.info (res.statusCode);
    }).on ('error', function (err) {
      winston.error (err);
    });

    Account.find ({}, function (err, accounts) {
      return res.render ('views/admin/accounts/index', {accounts: accounts});
    });
  };
};

AccountController.prototype.viewAccount = function () {
  return function (req, res) {
    if (!req.account)
      return res.redirect ('/admin/accounts');

    var account = req.account;
    return res.render ('views/admin/accounts/details', {account : account});
  };
}

exports = module.exports = AccountController;

