var blueprint = require ('../../../../lib')
  ;

var Person = require ('../models/Person')
  ;

function PersonController () {
  blueprint.ResourceController.call (this, { name: 'person', model: Person });
}

blueprint.controller (PersonController, blueprint.ResourceController);

module.exports = exports = PersonController;
