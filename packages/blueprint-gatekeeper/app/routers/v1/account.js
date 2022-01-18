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

const {
  policies: {
    check
  }
} = require ('@onehilltech/blueprint');

module.exports = {
  '/accounts' : {
    policy: check ('gatekeeper.auth.bearer'),

    resource: {
      controller: 'gatekeeper.account',
      deny: ['count'],
    },

    '/authenticate': {
      post: {action: 'gatekeeper.account@authenticate'}
    },

    '/:accountId': {
      '/password': {
        post: { action: 'gatekeeper.account@changePassword', policy: 'gatekeeper.account.password.change' }
      },

      '/impersonate': {
        post: { action: 'gatekeeper.account@impersonate', policy: 'gatekeeper.account.impersonate'}
      },

      '/verify': {
        post: { action: 'gatekeeper.account@verify', policy: 'gatekeeper.account.verify' }
      },

      '/resend': {
        post: { action: 'gatekeeper.account@resend', policy: 'gatekeeper.account.verify' }
      }
    }
  }
};
