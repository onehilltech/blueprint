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

const {expect} = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const { seed, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');
const { request } = require ('@onehilltech/blueprint-testing');

describe.only ('app | routers | password', function () {
  function getTokenGenerator () {
    const gatekeeper = blueprint.lookup ('service:gatekeeper');
    return gatekeeper.getTokenGenerator ('gatekeeper:password_reset');
  }

  describe ('/v1/password/forgot', function () {
    it.only ('should initiate forgot password sequence', function () {
      let {accounts} = seed ('$default');
      const account = accounts[0];

      blueprint.app.once ('gatekeeper.password.forgot', (client, acc, token) => {
        expect (acc.id).to.eql (account.id);

        let payload = getTokenGenerator ().verifyTokenSync (token);
        expect (payload.jti).to.equal (account.id);
      });

      return request ()
        .post ('/v1/password/forgot')
        .withClientToken (0)
        .send ({email: account.email})
        .expect (200, 'true');
    });

    it ('should not allow the client to reset password', function () {
      let {accounts} = seed ('$default');
      const account = accounts[0];

      return request ()
        .post ('/v1/password/forgot')
        .withClientToken (2)
        .send ({email: account.email})
        .expect (403, {errors:[{code: "no_password_reset", detail: "This client is not allowed to reset passwords.", status: "403"}]});
    });
  });

  describe ('/v1/password/reset', function () {
    describe ('POST', function () {
      it ('should reset the account password', function () {
        let {accounts} = seed ('$default');
        const account = accounts[0];

        blueprint.once ('gatekeeper.password.reset', (acc) => {
          expect (acc.id).to.equal (account.id);
          expect (acc.password).to.not.equal ('1234567890');
          expect (acc.verifyPasswordSync ('1234567890')).to.be.true;
        });

        return getTokenGenerator ().generateToken ({jti: account.id}).then (token => {
          return request ()
            .post ('/v1/password/reset')
            .send ({'reset-password': {token: token, password: '1234567890'}})
            .expect (200, 'true');
        });
      });

      it ('should fail because of missing parameters', function () {
        return request ()
          .post ('/v1/password/reset')
          .expect (400, { errors:
              [ { code: 'validation_failed',
                detail: 'The request validation failed.',
                status: '400',
                meta: {
                  validation: {
                    'reset-password.password': {
                      location: 'body',
                      msg: 'This field is required.',
                      param: 'reset-password.password'
                    },

                    'reset-password.token': {
                      location: 'body',
                      msg: 'This field is required.',
                      param: 'reset-password.token'
                    }
                  }
                }} ] });
      });

      it ('should fail because of bad token', function () {
        return request ()
          .post ('/v1/password/reset')
          .send ({'reset-password': {token: 'bad-token', password: '1234567890'}})
          .expect (403, { errors: [ { code: 'invalid_token', detail: 'jwt malformed', status: '403' } ] });
      });

      it ('should fail because account is unknown', function () {
        return getTokenGenerator ().generateToken ({jti: new ObjectId ().toString ()}).then (token => {
          return request ()
            .post ('/v1/password/reset')
            .send ({'reset-password': {token: token, password: '1234567890'}})
            .expect (403, { errors:
                [ { code: 'unknown_account',
                  detail: 'The account does not exist.',
                  status: '403' } ] });
        });
      });

      it ('should fail because account is disabled', function () {
        let {accounts} = seed ('$default');
        const account = accounts[4];

        return getTokenGenerator ().generateToken ({jti: account.id}).then (token => {
          return request ()
            .post ('/v1/password/reset')
            .send ({'reset-password': {token: token, password: '1234567890'}})
            .expect (403, { errors:
                [ { code: 'account_disabled',
                  detail: 'The account is disabled.',
                  status: '403' } ] });
        });
      });
    });
  });
});
