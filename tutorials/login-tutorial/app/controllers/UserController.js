'use strict';

var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = UserController;

function UserController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (UserController);

UserController.prototype.showMe = function () {
  return function (req, res) {
    res.render ('user.handlebars', {user: req.user});
  }
};

