var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  ;

var datamodel  = require ('../../../../fixtures/datamodel')
  ;

describe ('listener:cloud-messaging.publish', function () {
  before (function (done) {
    datamodel.apply (done);
  });

  it ('should publish data on the topic', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var topic = '/topics/foo-bar';

    messaging.on ('cloud-messaging.publish.callback', done);
    messaging.emit ('cloud-messaging.publish', topic, data);
  });
});
