'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  , Client    = require ('../models/Client')
  , ResourceController = mongodb.ResourceController
  ;

function ClientController () {
  ResourceController.call (this, {model: Client});
}

blueprint.controller (ClientController, ResourceController);

module.exports = ClientController;
