var winston = require ('winston')
  , util    = require ('util')
  , http    = require ('http')
  ;

var Account = require ('../models/account')
  ;

const SECRET_LENGTH = 48;

function AccountController (models) {
  this._opts = opts || {};
  this._model = models[Account.modelName];
}

AccountController.prototype.lookupAccountParam = function () {
  var self = this;

  return function (req, res, next, accountId) {
    winston.info ('searching for account ' + accountId);

    self._model.findById (accountId, function (err, account) {
      if (err)
        return next (err);

      if (!account)
        return next (new Error ('Account does not exist'));

      req.account = account;
      return next ();
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
  var self = this;

  return function (req, res) {
    var account = new self._model ({
      username : req.body.username,
      password : req.body.password,
      email    : req.body.email
    });

    account.save (function (err) {
      return res.status (200).send (err ? false : true);
    });
  };
};

