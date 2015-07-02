var winston  = require ('winston')
  , util     = require ('util')
  , uid      = require ('uid-safe')
  , Account  = require ('../models/account')
  ;

const SECRET_LENGTH=48;

function AccountController (opts) {
  this._opts = opts || {};
}

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

AccountController.prototype.getAccounts = function () {
  return function (req, res) {
    Account.find ({}, function (err, accounts) {
      return res.render ('admin/accounts/index', {accounts: accounts});
    })
  };
};

AccountController.prototype.getAccount = function () {
  return function (req, res) {
    if (!req.account)
      return res.redirect ('/admin/accounts');

    var account = req.account;
    return res.render ('admin/accounts/details', {account : account});
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

      res.send (200, err ? 'false' : 'true');
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
    if (!client)
      return res.status (404).send ();

    var account = new Account ({
      username : req.body.username,
      password : req.body.password,
      email    : req.body.email
    });

    account.save
  };
}

exports = module.exports = AccountController;

