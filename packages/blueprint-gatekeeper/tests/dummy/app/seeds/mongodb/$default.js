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
          name: 'client1',
          email: 'client1@gatekeeper.com',
          client_secret: 'client1',
          deny: [dab.ref ('accounts.6')],
          password_reset_url: 'http://localhost:4200/auth/reset-password',
          verify_account_url: 'http://localhost:4200/verify'
        },
        {
          name: 'client2',
          email: 'client2@gatekeeper.com',
          client_secret: 'client2'
        },
        {
          name: 'client3',
          email: 'client3@gatekeeper.com',
          client_secret: 'client3',
          enabled: false
        },
        {
          name: 'client4',
          email: 'client4@gatekeeper.com',
          client_secret: 'client4',
          allow: [dab.ref ('accounts.6')]
        },
        {
          name: 'client5',
          email: 'client5@gatekeeper.com',
          client_secret: 'client5',
          expiration: '5 seconds'
        }
      ],

      android: [
        {
          name: 'android1',
          client_secret: 'android1',
          email: 'android1@gatekeeper.com',
          package: 'com.onehilltech.gatekeeper',
        }
      ],

      recaptcha: [
        {
          name: 'recaptcha1',
          recaptcha_secret: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
          email: 'james@onehilltech.com',
          scope: ['gatekeeper.account.create'],
          origin: 'http://localhost'
        },

        {
          name: 'recaptcha2',
          recaptcha_secret: 'invalid-secret',
          email: 'james@onehilltech.com',
          scope: ['gatekeeper.account.create'],
          origin: 'http://localhost'
        }
      ],

      accounts: [
        {
          email: 'hilljh82@gmail.com',
          username: 'account1',
          password: 'account1',
          verification: {
            date: new Date (),
            ip_address: '127.0.0.1'
          }
        },
        {
          email: 'account2@gatekeeper.com',
          username: 'account2',
          password: 'account2',
        },
        {
          email: 'account3@gatekeeper.com',
          username: 'account3',
          password: 'account3',
        },
        {
          email: 'account4@gatekeeper.com',
          username: 'account4',
          password: 'account4',
          scope: ['gatekeeper.account.update.scope']
        },
        {
          email: 'account5@gatekeeper.com',
          username: 'account5',
          password: 'account5',
          enabled: false
        },
        {
          email: 'account6@gatekeeper.com',
          username: 'account6',
          password: 'account6',
          enabled: true
        },
        {
          email: 'account7@gatekeeper.com',
          username: 'account7',
          password: 'account7'
        }
      ],

      user_tokens: [
        { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['gatekeeper.account.*'], refresh_token: dab.id () },
        { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['gatekeeper.account.get_all'], refresh_token: dab.id () },
        { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['dummy'], refresh_token: dab.id () },
        { client: dab.ref ('native.1'), account: dab.ref ('accounts.0'), enabled: false, refresh_token: dab.id () },
        { client: dab.ref ('native.2'), account: dab.ref ('accounts.0'), refresh_token: dab.id ()},
        { client: dab.ref ('native.0'), account: dab.ref ('accounts.4'), refresh_token: dab.id ()},
        { client: dab.ref ('recaptcha.0'), account: dab.ref ('accounts.0'), refresh_token: dab.id ()},
        { client: dab.ref ('android.0'), account: dab.ref ('accounts.0'), refresh_token: dab.id ()},
        { client: dab.ref ('android.0'), account: dab.ref ('accounts.1'), refresh_token: dab.id ()},
        { client: dab.ref ('android.0'), account: dab.ref ('accounts.0'), refresh_token: dab.id (), usage: { current: 1, max: 1}}
      ],

      client_tokens: [
        { client: dab.ref ('native.0'), scope: ['gatekeeper.account.create']},
        { client: dab.ref ('native.0'), scope: ['dummy']},
        { client: dab.ref ('native.1'), scope: ['dummy']}
      ],

      books: [
        { title: 'The Great Gatsby', owner: dab.ref ('accounts.0') }
      ]
    };
  }
});
