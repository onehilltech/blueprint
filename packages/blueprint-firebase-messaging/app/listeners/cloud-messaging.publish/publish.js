var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Sender    = require ('../../../lib/Sender')
  ;

var sender;

const DEFAULT_RELAY_CALLBACK = 'cloud-messaging.publish.callback';

messaging.on ('app.init', function (app) {
  var config = app.configs['cloud-messaging'];
  sender = new Sender (config);
});

function publish (topic, message, relayTopic) {
  relayTopic = relayTopic || DEFAULT_RELAY_CALLBACK;
  sender.publish (topic, message, messaging.relay (relayTopic));
}

module.exports = exports = publish;
