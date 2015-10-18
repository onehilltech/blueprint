var xpression = require ('xpression')
  , util      = require ('util')
  ;

function HelloWorldController () {
  xpression.BaseController.call (this);
}

xpression.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function (callback) {
  var self = this;

  return function (req, res) {
    return res.render ('helloworld', {name: req.body.name});
  };
};

module.exports = exports = HelloWorldController;
