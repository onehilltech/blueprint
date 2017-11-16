'use strict';

var blueprint          = require ('@onehilltech/blueprint')
  , mongodb            = require ('../../../../../lib')
  , Person             = require ('../models/Person')
  , ResourceController = mongodb.ResourceController
  ;

function PersonController () {
  ResourceController.call (this, {model: Person});
}

blueprint.controller (PersonController, ResourceController);

module.exports = PersonController;
