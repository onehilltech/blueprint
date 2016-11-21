'use strict';

var blueprint = require ('../../../../lib')
  ;

function SingleActionController () {

}

module.exports = SingleActionController;

blueprint.controller (SingleActionController);

SingleActionController.prototype.__invoke = function () {
  return function (req, res) {
    res.status (200).send ('Hello, World!');
  }
};
