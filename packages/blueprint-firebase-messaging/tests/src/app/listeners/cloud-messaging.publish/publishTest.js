var async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  ;

var datamodel  = require ('../../../../fixtures/datamodel')
  , appFixture = require ('../../../../fixtures/app')
  ;

describe ('listener:cloud-messaging.publish', function () {
  before (function (done) {
    async.series ([
      function (callback) { appFixture (callback); },
      function (callback) { datamodel.apply (callback); }
    ], done);
  });

  it ('should publish data on the topic', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var topic = '/topics/foo-bar';

    messaging.once ('cloud-messaging.publish.callback', done);
    messaging.emit ('cloud-messaging.publish', topic, data);
  });
});
