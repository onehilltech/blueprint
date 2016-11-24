'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , SocketIO  = require ('../../../../lib')()
  ;

module.exports = EchoController;

function EchoController () {

}

blueprint.controller (EchoController);

EchoController.prototype.__invoke = function (args) {
  SocketIO.io.on ('connection', function (socket) {
    console.log ('a user connected');
  });

  return function (req, res) {
    res.status (200).render ('chat.html');
  }
};
