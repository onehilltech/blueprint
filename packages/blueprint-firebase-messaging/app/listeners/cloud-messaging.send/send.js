var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Sender    = require ('../../../lib/Sender')
  ;

var sender;

messaging.once ('app.init', function (app) {
  var config = app.configs['cloud-messaging'];
  sender = new Sender (config);
});

function send (recipients, message) {
  sender.send (recipients, message, messaging.relay ('cloud-messaging.send.callback'));
}

module.exports = exports = send;
