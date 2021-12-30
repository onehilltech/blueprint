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
const { seed, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');
const { request } = require ('@onehilltech/blueprint-testing');
const { expect } = require ('chai');

describe ('app | routers | verification', function () {
  async function generateToken (account, client) {
    return blueprint.lookup ('service:verification').generateToken (account, client);
  }

  describe.only ('/v1/verify', function () {
    it ('should verify an account', async function () {
      const { accounts: [ , account ], native: [ client ]} = seed ();
      const token = await generateToken (account, client);

      await request ()
        .get ('/v1/verify')
        .query ({token, redirect: 'https://localhost'})
        .expect (301);

      const updated = await blueprint.lookup ('model:account').findById (account._id);
      expect (updated.verification.required).to.be.true;
      expect (updated.verification.date).to.be.a ('date');
      expect (updated.verification.ip_address).to.equal ('::ffff:127.0.0.1');
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

    it ('should fail because of unknown account', async function () {
      const { native: [ client ]} = seed ();
      const token = await generateToken ({ id: new ObjectId ().toString () }, client);

      return request ()
        .get ('/v1/verify')
        .query ({token, redirect: 'https://localhost'})
        .expect (400, {
          errors: [
            {
              code: 'verification_failed',
              detail: 'The account is unknown.',
              status: '400'
            }
          ]
        });
    });

    it ('should fail because of disabled account', async function () {
      const { native: [ client ], accounts: [,,,,account]} = seed ();
      const token = await generateToken ({ id: account.id }, client);

      return request ()
        .get ('/v1/verify')
        .query ({token, redirect: 'https://localhost'})
        .expect (400, {
          errors: [
            {
              code: 'verification_failed',
              detail: 'The account is disabled.',
              status: '400'
            }
          ]
        });

    });

    it ('should fail because account is verified', async function () {
      const { accounts: [ account ], native: [ client ]} = seed ();
      const token = await generateToken (account, client);

      await request ()
        .get ('/v1/verify')
        .query ({token, redirect: 'https://localhost'})
        .expect (400, {
          errors: [
            {
              code: 'verification_failed',
              detail: 'The account has already been verified.',
              status: '400'
            }
          ]
        });
    });
  });
});
