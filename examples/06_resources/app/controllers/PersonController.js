var blueprint = require ('@onehilltech/blueprint')
  , util      = require ('util')
  ;

var Person = require ('../models/Person')
  ;

function PersonController () {
  blueprint.ResourceController.call (this, Person, 'personId');
}

blueprint.controller (PersonController, blueprint.ResourceController);

module.exports = exports = PersonController;

