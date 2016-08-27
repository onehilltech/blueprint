var async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  ;

var datamodel  = require ('../../../../fixtures/datamodel')
  , appFixture = require ('../../../../fixtures/app')
  ;

describe ('listener:cloud-messaging.send', function () {
  before (function (done) {
    async.series ([
      function (callback) { appFixture (callback); },
      function (callback) { datamodel.apply (callback); }
    ], done);
  });

  it ('should send data to recipients', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var recipient = datamodel.models.accounts[0]._id;

    messaging.once ('cloud-messaging.send.callback', done);
    messaging.emit ('cloud-messaging.send', recipient, data);
  });
});
