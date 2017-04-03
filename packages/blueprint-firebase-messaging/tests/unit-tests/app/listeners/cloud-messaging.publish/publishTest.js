'use strict';

const blueprint = require ('@onehilltech/blueprint');
  ;

describe ('listener:cloud-messaging.publish', function () {
  it ('should publish data on the topic', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var topic = '/topics/foo-bar';

    blueprint.messaging.on ('cloud-messaging.publish.callback', done);
    blueprint.messaging.emit ('cloud-messaging.publish', topic, data);
  });
});
