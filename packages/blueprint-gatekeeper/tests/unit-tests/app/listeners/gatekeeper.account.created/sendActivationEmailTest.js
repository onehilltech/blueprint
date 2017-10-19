'use strict';

let blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , listener  = require ('../../../../../app/listeners/gatekeeper.account.created/sendActivationEmail')
  ;

describe ('listeners:gatekeeper.account.created:sendActivationEmail', function () {
  it ('should send a mock activate email', function (done) {
    let account = blueprint.app.seeds.$default.accounts[0];
    let received = false;

    blueprint.messaging.once ('gatekeeper.email.account_activation.sent', function (account, info) {
      expect (account).to.equal (account);

      received = true;
    });

    listener (account);

    blueprint.testing.waitFor (() => { return received; }, done);
  });
});