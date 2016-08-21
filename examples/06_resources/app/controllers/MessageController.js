var blueprint = require ('@onehilltech/blueprint')
  ;

var Message = require ('../models/Message')
  ;

function MessageController () {
  blueprint.ResourceController.call (this, {name: 'message', model: Message});
}

blueprint.controller (MessageController, blueprint.ResourceController);

module.exports = exports = MessageController;
