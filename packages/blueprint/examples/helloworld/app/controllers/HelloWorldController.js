var blueprint = require ('blueprint')
  , util      = require ('util')
  ;

function HelloWorldController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function (callback) {
  return function (req, res) {
    return res.render ('helloworld', {name: req.body.name});
  };
};

HelloWorldController.prototype.lookupParam = function () {
  return function (res, req, param, next) {
    return next ();
  };
};

module.exports = exports = HelloWorldController;
