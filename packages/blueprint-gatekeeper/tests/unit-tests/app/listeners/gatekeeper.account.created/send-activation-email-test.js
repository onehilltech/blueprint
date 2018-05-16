const blueprint  = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe.skip ('app | listeners | gatekeeper.account.created | send-activation-email', function () {
  it ('should send a mock activate email', function () {

    blueprint.lookup ('listener:gatekeeper\\.account\\.created:send-activation-email');
    let account = blueprint.app.seeds.$default.accounts[0];
    let received = false;

    blueprint.messaging.once ('gatekeeper.email.account_activation.sent', function (account, info) {
      expect (account).to.equal (account);

      expect (info).to.have.nested.property ('envelope.from', 'no-reply@onehilltech.com');
      expect (info).to.have.nested.property ('envelope.to[0]', account.email);

      received = true;
    });

    listener (account);

    blueprint.testing.waitFor (() => { return received; }, done);
  });
});