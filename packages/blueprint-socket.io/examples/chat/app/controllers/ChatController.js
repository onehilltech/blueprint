'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , SocketIO  = require ('@onehilltech/blueprint-socket.io')
  ;

module.exports = ChatController;

function ChatController () {

}

blueprint.controller (ChatController);

ChatController.prototype.__invoke = function (args) {
  SocketIO.io.listen (function (nsp, socket) {
    console.log ('a user connected');

    socket.on ('disconnect', function(){
      console.log ('user disconnected');
    });

    socket.on ('chat message', function(msg){
      console.log('message: ' + msg);

      socket.emit ('chat message', msg);
    });
  });

  return function (req, res) {
    res.status (200).render ('chat.handlebars');
  }
};
