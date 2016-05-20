var blueprint = require ('../../../../../lib')
  ;

function TestController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (TestController);

TestController.prototype.helloWorld = function () {
  return function helloWorld (req, res) {
    return res.status (200).send ('Hello, World!');
  };
};

TestController.prototype.innerHelloWorld = function () {
  return function innerHelloWorld (req, res) {
    return res.status (200).send ('Hello, World!');
  };
};

module.exports = exports = TestController;
