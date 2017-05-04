var blueprint = require ('@onehilltech/blueprint')
  , util      = require ('util')
  ;

function HelloWorldController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function () {
  var self = this;

  return function (req, res) {
    return res.render ('helloworld.pug', {name: req.body.name});
  };
};

module.exports = exports = HelloWorldController;
