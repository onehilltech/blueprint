var passport = require ('passport')
  ;

var local = require ('../authentication/local')
  ;

passport.use (local ());

function AdminController () {

}

AdminController.prototype.isLoggedIn = function () {
  return function (req, res, next) {
    if (req.isAuthenticated ())
      return next();

    res.redirect ('/admin/login');
  };
}

AdminController.prototype.viewHomePage = function () {
  return function (req, res) {
    return res.render ('views/admin/index');
  };
};

AdminController.prototype.viewLoginPage = function () {
  return function (req, res) {
    return res.render ('views/admin/login')
  };
};

AdminController.prototype.authenticate = function () {
  var opts = {
    successRedirect : '/admin',
    failureRedirect : '/admin/login'
  };

  return passport.authenticate ('local', opts);
};

AdminController.prototype.logout = function () {
  return function (req, res) {
    req.logout ();
    res.redirect ('/admin');
  };
};

exports = module.exports = AdminController;

