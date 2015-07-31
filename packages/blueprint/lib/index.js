var util = require ('util')
  ;

var BaseController = require ('./BaseController')
  , Application    = require ('./Application')
  ;

exports.BaseController = BaseController;
exports.Application = Application;

exports.controller = function (controller, base) {
  base = base || BaseController;

  util.inherits (controller, base);
};
