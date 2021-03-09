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

const blueprint = require ('@onehilltech/blueprint');
const {expect} = require ('chai');
const {seed} = require ('@onehilltech/blueprint-mongodb');

describe ('app | services | fcm', function () {
  function getService () {
    return blueprint.lookup ('service:fcm');
  }

  describe ('init', function () {
    it ('should initialize the service', function () {
      let fcm = getService ();

      expect (fcm.dryRun).to.be.true;
    });
  });


  describe ('send', function () {
    it ('should send a data message to a single user', function () {
      const {accounts} = seed ();
      const account = accounts[0];

      return getService ().send (account.id, {msg: 'Hello, World!'});
    });

    it ('should send a data message to a list of users', function () {
      const {accounts} = seed ();
      return getService ().send ([accounts[0].id, accounts[1].id], {msg: 'Hello, World!'});
    });
  });

  describe ('publish', function () {
    it ('should publish data to a topic', function () {
      let topic = '/topics/foo-bar';
      return getService ().publish (topic, {msg: 'Hello, World!'});
    });
  });
});