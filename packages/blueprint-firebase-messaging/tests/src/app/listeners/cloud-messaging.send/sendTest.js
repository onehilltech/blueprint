var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  ;

var datamodel  = require ('../../../../fixtures/datamodel')
  ;

describe ('listener:cloud-messaging.send', function () {
  before (function (done) {
    datamodel.apply (done);
  });

  it ('should send data to recipients', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var recipient = datamodel.models.accounts[0]._id;

    messaging.on ('cloud-messaging.send.callback', done);
    messaging.emit ('cloud-messaging.send', recipient, data);
  });
});
