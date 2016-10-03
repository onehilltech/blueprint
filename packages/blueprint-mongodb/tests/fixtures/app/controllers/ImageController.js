'use strict';

var blueprint        = require ('@onehilltech/blueprint')
  , mongodb          = require ('../../../../lib')
  , GridFSController = mongodb.GridFSController
  ;

function ImageController () {
  GridFSController.call (this, mongodb.getConnectionManager ().defaultConnection, {name: 'image'});
}

blueprint.controller (ImageController, GridFSController);

module.exports = ImageController;
