var blueprint = require ('../../../../lib')
  , GridFSController = blueprint.GridFSController
  ;

function ImageController () {
  GridFSController.call (this, {name: 'image'});
}

blueprint.controller (ImageController, GridFSController);

module.exports = exports = ImageController;
