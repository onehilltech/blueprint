var winston = require ('winston')
  , util    = require ('util')
  , http    = require ('http')
  ;

var ViewController    = require ('./viewController')
  , AccountController = require ('./accountController')
  ;

const SECRET_LENGTH = 48;

function AccountViewController () {
  ViewController.call (this);

  this.base = new AccountController ();
}

util.inherits (AccountViewController, ViewController);

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

exports = module.exports = AccountViewController;

