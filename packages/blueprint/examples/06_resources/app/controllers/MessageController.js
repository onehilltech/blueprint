'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  ;

var Message = require ('../models/Message')
  ;

function MessageController () {
  mongodb.ResourceController.call (this, {name: 'message', model: Message});
}

blueprint.controller (MessageController, mongodb.ResourceController);

module.exports = MessageController;
