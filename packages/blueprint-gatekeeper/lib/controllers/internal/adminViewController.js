var passport = require ('passport')
  , request  = require ('request')
  , winston  = require ('winston')
  , util     = require ('util')
  ;

var local          = require ('../../authentication/local')
  , ViewController = require ('./viewController')
  ;

passport.use (local ());

function AdminViewController () {
  ViewController.call (this);
}

util.inherits (AdminViewController, ViewController);

AdminViewController.prototype.isLoggedIn = function () {
  return function (req, res, next) {
    if (req.isAuthenticated ())
      return next();

    req.session.returnTo = req.originalUrl || req.url;
    res.redirect ('/admin/login');
  };
}

AdminViewController.prototype.viewHomePage = function () {
  return function (req, res) {
    return res.render ('views/admin/index');
  };
};

AdminViewController.prototype.viewLoginPage = function () {
  return function (req, res) {
    return res.render ('views/admin/login')
  };
};

AdminViewController.prototype.authenticate = function () {
  var opts = {
    successReturnToOrRedirect : '/admin',
    failureRedirect : '/admin/login'
  };

  return passport.authenticate ('local', opts);
};

AdminViewController.prototype.logout = function () {
  return function (req, res) {
    req.logout ();
    res.redirect ('/admin');
  };
};

exports = module.exports = AdminViewController;

