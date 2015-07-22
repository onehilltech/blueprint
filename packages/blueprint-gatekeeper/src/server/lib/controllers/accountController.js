var winston = require ('winston')
  , util    = require ('util')
  , http    = require ('http')
  ;

var AdminController = require ('./adminController')
  , Account         = require ('../models/account')
  ;

const SECRET_LENGTH = 48;

function AccountController (opts) {
  this._opts = opts || {};
}

util.inherits (AccountController, AdminController);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api methods

AccountController.prototype.lookupAccountParam = function () {
  return function (req, res, next, account_id) {
    winston.info ('searching for account ' + account_id);

    Account.findById (account_id, function (err, account) {
      if (err)
        return next (err);

      if (!account)
        return next (new Error ('account does not exist'))

      req.account = account;
      next ();
    });
  };
};

AccountController.prototype.deleteAccount = function () {
  return function (req, res) {
    if (!req.account)
      return res.status (404).send ();

    var account = req.account;
    account.remove (function (err) {
      return res.status (200).send (err ? false : true);
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

      res.status (200).send (err ? false : true);
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
      return res.status (200).send (err ? false : true);
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
      return res.status (200).send (err ? false : true);
    });
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Views

AccountController.prototype.viewAccounts = function () {
  var self = this;

  return function (req, res) {
    Account.find ({}, function (err, accounts) {
      self.renderWithAccessToken (req, res, 'views/admin/accounts/index', {accounts : accounts});
    });
  };
};

AccountController.prototype.viewAccount = function () {
  var self = this;

  return function (req, res) {
    if (!req.account)
      return res.redirect ('/admin/accounts');

    self.renderWithAccessToken (req, res, 'views/admin/accounts/details',  {account : req.account});
  };
};

exports = module.exports = AccountController;

