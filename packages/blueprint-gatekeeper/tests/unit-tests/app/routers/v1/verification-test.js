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

const {
  seed, lean,
  Types: { ObjectId }
} = require ('@onehilltech/blueprint-mongodb');

const { request } = require ('@onehilltech/blueprint-testing');
const { expect } = require ('chai');

describe ('app | routers | verification', function () {
  function getTokenGenerator () {
    let gatekeeper = blueprint.lookup ('service:gatekeeper');
    return gatekeeper.getTokenGenerator ('gatekeeper:account_verification');
  }

  describe ('/v1/verify', function () {
    it ('should verify an account', function () {
      const {accounts} = seed ('$default');
      const account = accounts[0];

      return getTokenGenerator ().generateToken ({jti: account.id})
        .then (token => {
          return request ()
            .get ('/v1/verify')
            .query ({token, redirect: 'https://localhost'})
            .expect (301, {})
        })
        .then (() => blueprint.lookup ('model:account').findById (account._id))
        .then (account => {
          expect (account.verification.required).to.be.false;
          expect (account.verification.date).to.be.a ('date');
          expect (account.verification.ip_address).to.equal ('::ffff:127.0.0.1');
        });
    });

    it ('should fail because of missing parameters', function () {
      return request ()
        .get ('/v1/verify')
        .expect (400, { errors:
            [ { code: 'validation_failed',
              detail: 'The request validation failed.',
              status: '400',
              meta: {
                validation: {
                  redirect: {
                    location: 'query',
                    msg: 'This field is not a URL.',
                    param: 'redirect'
                  },

                  token: {
                    location: 'query',
                    msg: 'This field is required.',
                    param: 'token'
                  }
                }
              }}]});
    });

    it ('should fail because of invalid token', function () {
      return request ()
        .get ('/v1/verify')
        .query ({token: 'bad-token', redirect: 'https://localhost'})
        .expect (403, { errors: [ { code: 'invalid_token', detail: 'jwt malformed', status: '403' } ] });
    });

    it ('should fail because of unknown account', function () {
      return getTokenGenerator ().generateToken ({jti: new ObjectId ()})
        .then (token => {
          return request ()
            .get ('/v1/verify')
            .query ({token, redirect: 'https://localhost'})
            .expect (403, { errors:
                [ { code: 'unknown_account',
                  detail: 'The account is unknown.',
                  status: '403' } ] });
        });
    });

    it ('should fail because of disabled account', function () {
      const {accounts} = seed ('$default');
      const account = accounts[4];

      return getTokenGenerator ().generateToken ({jti: account.id})
        .then (token => {
          return request ()
            .get ('/v1/verify')
            .query ({token, redirect: 'https://localhost'})
            .expect (403, { errors:
                [ { code: 'account_disabled',
                  detail: 'The account is disabled.',
                  status: '403' } ] });
        });
    });

    it ('should fail because account is verified', function () {
      const {accounts} = seed ('$default');
      const account = accounts[5];

      return getTokenGenerator ().generateToken ({jti: account.id})
        .then (token => {
          return request ()
            .get ('/v1/verify')
            .query ({token, redirect: 'https://localhost'})
            .expect (403, { errors:
                [ { code: 'already_verified',
                  detail: 'The account has already been verified.',
                  status: '403',
                  meta: { verification: lean (account.verification) }} ] });
        });
    });
  });
});
