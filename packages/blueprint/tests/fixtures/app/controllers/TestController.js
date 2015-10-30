var blueprint = require ('../../../../lib')
  ;

function TestController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (TestController);

TestController.prototype.helloWorld = function (callback) {
  return function echoName (req, res) {
    return res.status (200).send ('Hello, World!');
  };
};

module.exports = exports = TestController;
