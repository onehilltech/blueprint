const blueprint = require ('@onehilltech/blueprint');

describe ('listener | cloud-messaging | send', function () {
  it ('should send data to recipients', function (done) {
    var data = {device: '1234567890', token: 'aabbccdd'};
    var recipient = blueprint.app.seeds.$default.accounts[0].id;

    blueprint.messaging.on ('cloud-messaging.send.callback', done);
    blueprint.messaging.emit ('cloud-messaging.send', recipient, data);
  });
});
