var xpression = require ('xpression')
  , util      = require ('util')
  ;

function HelloWorldController () {
  xpression.BaseController.call (this);
}

xpression.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function () {
  return function echoName (req, res) {
    return res.render ('helloworld', {name: req.body.whoami});
  };
};

module.exports = exports = HelloWorldController;
