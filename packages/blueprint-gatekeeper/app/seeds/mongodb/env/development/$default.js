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

const { Seed } = require ('@onehilltech/blueprint-mongodb');
const dab = require ('@onehilltech/dab');

/**
 * @class
 */
module.exports = Seed.extend ({
  model () {
    return {
      native: [
        {
          _id: dab.id ('58ed90e1105aee00001e429f'),
          name: 'gatekeeper-android',
          client_secret: 'gatekeeper-android',
          email: 'james@onehilltech.com',
          scope: ['gatekeeper.account.create'],
          password_reset_url: 'http://localhost:4200/auth/reset-password',
          expiration: '10 minutes'
        }
      ],

      android: [
        {
          _id: dab.id ('593dc15c33812acb3a46ff30'),
          name: 'gatekeeper-android-demo',
          client_secret: 'gatekeeper-android-demo',
          email: 'james@onehilltech.com',
          package: 'com.onehilltech.gatekeeper.android.examples.standard',
          scope: ['gatekeeper.account.create']
        }
      ],

      recaptcha: [
        {
          _id: dab.id ('5a206991201dc8357e45d174'),
          name: 'gatekeeper-recaptcha',
          recaptcha_secret: '6LdcLDcUAAAAAL8U9Im2z-kebfr9M1oqL1lLS0C7',
          email: 'james@onehilltech.com',
          scope: ['gatekeeper.account.create'],
          origin: 'http://localhost:4200',
          expiration: '10 minutes'
        }
      ],

      accounts: [
        {
          _id: dab.id ('58ed92f64da0861f6aeb98cf'),
          email: 'tester@onehilltech.com',
          username: 'account1',
          password: 'account1',
        }
      ]
    };
  }
});
