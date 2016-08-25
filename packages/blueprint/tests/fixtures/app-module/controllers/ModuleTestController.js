var blueprint = require ('../../../../lib')
  ;

function ModuleTestController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (ModuleTestController);

ModuleTestController.prototype.helloWorld = function () {
  return function helloWorld (req, res) {
    return res.status (200).send ('Hello, World!');
  };
};

module.exports = exports = ModuleTestController;
