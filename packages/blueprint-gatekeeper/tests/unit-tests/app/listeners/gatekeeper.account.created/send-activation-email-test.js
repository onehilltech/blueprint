/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const blueprint  = require ('@onehilltech/blueprint');
const { seed }   = require ('@onehilltech/blueprint-mongodb');
const { expect } = require ('chai');

describe.only ('app | listeners | gatekeeper.account.created | send-activation-email', function () {
  it ('should send a mock activate email', function () {
    const listener = blueprint.lookup (['listener', 'gatekeeper.account.created', 'send-activation-email']);
    const {accounts} = seed ();
    const account = accounts[0];

    let received = false;

    blueprint.once ('gatekeeper.email.account_activation.sent', (account, info) => {
      expect (account).to.equal (account);

      expect (info).to.have.nested.property ('envelope.from', 'no-reply@onehilltech.com');
      expect (info).to.have.nested.property ('envelope.to[0]', account.email);

      received = true;
    });

    return listener.handleEvent (account);
  });
});