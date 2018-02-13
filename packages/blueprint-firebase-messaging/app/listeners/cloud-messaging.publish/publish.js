const blueprint = require ('@onehilltech/blueprint');
const messaging = blueprint.messaging;
const Sender    = require ('../../../lib/Sender');

let sender;

const DEFAULT_RELAY_CALLBACK = 'cloud-messaging.publish.callback';

messaging.on ('app.init', function (app) {
  const firebase = app.configs.firebase;
  const FirebaseDevice = app.models.device;

  sender = new Sender (FirebaseDevice, firebase);
});

function publish (topic, message, relayTopic) {
  relayTopic = relayTopic || DEFAULT_RELAY_CALLBACK;
  sender.publish (topic, message, messaging.relay (relayTopic));
}

module.exports = exports = publish;
