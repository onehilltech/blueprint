var xpression = require ('../../../../lib')
  ;

function TestController () {
  xpression.BaseController.call (this);
}

xpression.controller (TestController);

TestController.prototype.helloWorld = function (callback) {
  return function echoName (req, res) {
    return res.status (200).send ('Hello, World!');
  };
};

module.exports = exports = TestController;
