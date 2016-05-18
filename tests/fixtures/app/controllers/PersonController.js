var blueprint = require ('../../../../lib')
  ;

var Person = require ('../models/Person')
  ;

function PersonController () {
  blueprint.ResourceController.call (this, {model: Person, id: 'personId'});
}

blueprint.controller (PersonController, blueprint.ResourceController);

module.exports = exports = PersonController;
