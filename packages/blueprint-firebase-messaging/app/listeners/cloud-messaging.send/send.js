var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , Sender    = require ('../../../lib/Sender')
  ;

var sender;

const DEFAULT_RELAY_CALLBACK = 'cloud-messaging.send.callback';

messaging.on ('app.init', function (app) {
  var config = app.configs['cloud-messaging'];
  var CloudToken = app.models.CloudToken;

  sender = new Sender (CloudToken, config);
});

function send (recipients, message, relayTopic) {
  relayTopic = relayTopic || DEFAULT_RELAY_CALLBACK;
  sender.send (recipients, message, messaging.relay (relayTopic));
}

module.exports = exports = send;
