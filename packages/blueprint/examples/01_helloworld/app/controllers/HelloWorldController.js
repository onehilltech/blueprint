var blueprint = require ('blueprint')
  , util      = require ('util')
  ;

function HelloWorldController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function () {
  return function echoName (req, res) {
    return res.render ('helloworld', {name: req.body.whoami});
  };
};

module.exports = exports = HelloWorldController;
