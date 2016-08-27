var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Sender    = require ('../../../lib/Sender')
  ;

var sender;

messaging.once ('app.init', function (app) {
  var config = app.configs['cloud-messaging'];
  sender = new Sender (config);
});

function publish (topic, message) {
  sender.publish (topic, message, messaging.relay ('cloud-messaging.publish.callback'));
}

module.exports = exports = publish;
