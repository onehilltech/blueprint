var blueprint = require ('@onehilltech/blueprint')
  ;

function LoginController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (LoginController);

LoginController.prototype.completeLogin = function () {
  return function (req, res) {
    return res.redirect ('/users/me');
  };
};

LoginController.prototype.logout = function () {
  return function (req, res) {
    req.logout ();
    res.redirect ('/login');
  }
};

module.exports = LoginController;
