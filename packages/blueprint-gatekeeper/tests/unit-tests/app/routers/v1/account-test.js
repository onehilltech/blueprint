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

const { expect } = require ('chai');
const { lean, seed, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');
const blueprint = require ('@onehilltech/blueprint');
const { request } = require ('@onehilltech/blueprint-testing');
const { omit } = require ('lodash');

describe ('app | routers | account', function () {
  describe ('/v1/accounts', function () {
    context ('GET', function () {
      it ('should return all the accounts for glob scope', function () {
        const { accounts } = seed ();

        const expected = accounts.map ((account) => {
          const obj = account.lean ();
          delete obj.verification;
          obj.verified = account.verified;

          return obj;
        });

        return request ()
          .get ('/v1/accounts')
          .withUserToken (0)
          .query ({_: {sort: {username: 1}}})
          .expect (200, { accounts: expected });
      });

      it ('should return all the accounts for valid scope', function () {
        const {accounts} = seed ('$default');
        const expected = accounts.map ((account) => {
          const obj = account.lean ();
          delete obj.verification;
          obj.verified = account.verified;

          return obj;
        });

        return request ()
          .get ('/v1/accounts')
          .query ({_: {sort: {username: 1}}})
          .withUserToken (1)
          .expect (200, { accounts: expected });
      });

      it ('should not allow request', function () {
        return request ()
          .get ('/v1/accounts')
          .withUserToken (2)
          .expect (403, { errors:
            [ { code: 'invalid_scope',
              detail: 'This request does not have a valid scope.',
              status: '403' } ] });
      });
    });

    context ('POST', function () {
      const data = { username: 'tester1', password: '1aBcDeFg', email: 'JAMES@ONEHILLTECH.COM' };

      it ('should create a new account with new id', async function () {
        const res = await request ()
          .post ('/v1/accounts')
          .send ({account: data})
          .withClientToken (0)
          .expect (200);

        expect (res.body)
          .to.have.property ('account')
          .to.deep.include ({
          enabled: true,
          scope: [],
          username: data.username,

          // the email address should be normalized
          email: data.email.toLowerCase (),
        });

        const { account } = res.body;

        // The system should have send an email.
        const emails = await blueprint.lookup ('model:email').find ();
        expect (emails).to.have.length (1);

        const [email] = emails;

        expect (account).to.have.property ('verification').to.include ({
          required: true,
          last_email: email.id,
          last_email_date: email.date.toISOString ()
        });
      });

      it ('should not allow client to set account id', function () {
        const _id = new ObjectId ();

        return request ()
          .post ('/v1/accounts')
          .send ({account: Object.assign ({_id}, data)})
          .withClientToken (0)
          .expect (200)
          .then (res => {
            expect (res.body).to.have.nested.property ('account._id').to.not.equal (_id.toString ());
          });
      });

      it ('should create a new account, and login the user', async function () {
        const autoLogin = {
          username: 'auto-login',
          password: '1aBcDeFg',
          email: 'auto-login@onehilltech.com'
        };

        const res = await request ()
          .post ('/v1/accounts')
          .query ({login: true})
          .send ({account: autoLogin})
          .withClientToken (0)
          .expect (200);

        expect (res.body).to.have.keys (['account', 'token']);
        expect (res.body.token).to.have.keys (['token_type', 'access_token', 'refresh_token']);
        expect (res.body.token).to.have.property ('token_type', 'Bearer');
      });

      it ('should restore a deleted account', async function () {
        const { accounts: [account]} = seed ();

        await request ()
          .delete (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .expect (200, 'true');

        const data = { username: account.username, password: '1aBcDeFg', email: account.email };

        const res = await request ()
          .post ('/v1/accounts')
          .withClientToken (0)
          .send ({account: data})
          .expect (200);

        expect (res.body).to.have.property ('account').to.deep.include ({
          _id: account.id,
          email: account.email,
          username: account.username,
          enabled: true,
          scope: []
        });

        const expected = await blueprint.lookup ('model:account').findById (account.id);
        expect (expected._stat.deleted_at).to.equal (undefined);
        expect (expected.password).to.not.equal (account.username);
      });

      it ('should not create an account [invalid password]', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        const dup = {username: 'tester1', password: 'tester1', email: 'dummy@me.com', created_by: account.created_by};

        return request ()
          .post ('/v1/accounts')
          .send ({account: dup})
          .withClientToken (0)
          .expect (403, { errors:
              [ { code: 'invalid_password',
                detail: 'The password is invalid.',
                status: '403' } ] });
      });

      it ('should not create an account [duplicate username]', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        const dup = {username: account.username, password: account.password, email: 'dummy@me.com', created_by: account.created_by};

        return request ()
          .post ('/v1/accounts')
          .send ({account: dup})
          .withClientToken (0)
          .expect (400, { errors:
              [ { code: 'username_exists',
                detail: 'An account with this username already exists.',
                status: '400' } ] });
      });

      it ('should not create an account [duplicate email]', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        const dup = {username: 'me', password: account.password, email: account.email, created_by: account.created_by};

        return request ()
          .post ('/v1/accounts')
          .send ({account: dup})
          .withClientToken (0)
          .expect (400, { errors:
              [ { code: 'email_exists',
                detail: 'An account with this email already exists.',
                status: '400' } ] });
      });

      it ('should not create an account [missing parameter]', function () {
        const invalid = {password: 'tester1', email: 'james@onehilltech.com'};

        return request ()
          .post ('/v1/accounts')
          .send (invalid)
          .withClientToken (0)
          .expect (400, {
            errors: [
              {
                code: 'validation_failed',
                detail: 'The request validation failed.',
                meta: {
                  validation: {
                    'account.email': {
                      location: 'body',
                      msg: 'This field is required.',
                      param: 'account.email',
                    },
                    'account.password': {
                      location: 'body',
                      msg: 'This field is required.',
                      param: 'account.password',
                    },
                    'account.username': {
                      location: 'body',
                      msg: 'This field is required.',
                      param: 'account.username',
                    }
                  }
                },
                status: '400'
              }
            ]
          });
      });

      it ('should not create an account [invalid scope]', function () {
        const account = { username: 'tester1', password: 'tester1', email: 'james@onehilltech.com'};

        return request ()
          .post ('/v1/accounts')
          .send ({account: account})
          .withClientToken (1)
          .expect (403, { errors: [{ status: '403', code: 'invalid_scope', detail: 'This request does not have a valid scope.' }] });
      });

      it ('should not create an account [invalid email]', function () {
        const account = { username: 'tester1', password: 'tester1', email: 'invalid'};

        return request ()
            .post ('/v1/accounts')
            .send ({account: account})
            .withClientToken (1)
            .expect (400, { errors: [{ status: '400', code: 'validation_failed', detail: 'The request validation failed.', meta: {
              validation: {
                'account.email': {
                  location: 'body',
                  msg: 'Not a valid email address.',
                  param: 'account.email',
                  value: 'invalid'
                }
              }
            } }] });
      });
    });
  });

  describe ('/v1/accounts/authenticate', function () {
    context ('POST', function () {
      it ('should authenticate logged in user', function () {
        const { accounts: [account]} = seed ();

        return request ()
          .post ('/v1/accounts/authenticate')
          .send ({authenticate: {password: account.username}})
          .withUserToken (0)
          .expect (200, 'true');
      });

      it ('should fail to authenticate logged in user', function () {
        const { accounts: [, account]} = seed ();

        return request ()
          .post ('/v1/accounts/authenticate')
          .send ({authenticate: {password: account.username}})
          .withUserToken (0)
          .expect (200, 'false');
      });

    })
  });

  describe ('/v1/accounts/:accountId', function () {
    context ('GET', function () {
      it ('should return the owner account', async function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];
        const expected = Object.assign (omit (account.lean (), ['verification']), { verified: true });

        const res = await request ()
          .get (`/v1/accounts/${account.id}`)
          .withUserToken (2)
          .expect (200, { account: expected });
      });

      it ('should return the account for me', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];
        const expected = Object.assign (omit (account.lean (), ['verification']), { verified: true });

        return request ()
          .get ('/v1/accounts/me')
          .withUserToken (2)
          .expect (200, { account: expected });
      });

      context ('get_all', function () {
        it ('should return account for a different user', function () {
          const {accounts} = seed ();
          const account = accounts[1];

          request ()
            .get (`/v1/accounts/${account.id}`)
            .withUserToken (1)
            .expect (200, {account: account.lean ()});
        });
      });

      context ('!get_all', function () {
        it ('should not return account for different user', function () {
          const {accounts} = seed ();
          const account = accounts[1];

          return request ()
            .get (`/v1/accounts/${account.id}`)
            .withUserToken (2)
            .expect (403, { errors:
                [ { code: 'forbidden_access',
                  detail: 'You do not have access to the account.',
                  status: '403' } ] });
        });
      });
    });

    context ('UPDATE', function () {
      it ('should update the scope', function () {
        const {accounts} = seed ('$default');
        const account = accounts[3];

        let updated = account.lean ();
        updated.scope.push ('the_new_scope');

        return request ()
          .put (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .send ({account: {scope: updated.scope}})
          .expect (200, {account: updated});
      });

      it ('should update the email', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        let updated = account.lean ();
        updated.email = 'foo@contact.com';

        return request ()
          .put (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .send ({account: {email: updated.email}} )
          .expect (200, {account: updated});
      });

      it ('should not update the scope', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        return request ()
          .put (`/v1/accounts/${account.id}`)
          .withUserToken (2)
          .send ({account: {scope: ['the_new_scope']}})
          .expect (403, { errors:
              [ { code: 'invalid_scope',
                detail: 'You are not allowed to update the account scope.',
                status: '403' } ] });
      });

      it ('should not update the password', function () {
        const {accounts} = seed ('$default');
        const account = accounts[3];

        return request ()
          .put (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .send ({account: {password: '1234567890'}})
          .expect (403, { errors:
              [ { code: 'forbidden',
                detail: 'You cannot update or delete the password.',
                status: '403' } ] });
      });
    });

    context ('DELETE', function () {
      it ('should allow account owner to delete account', function () {
        const {accounts: [account]} = seed ('$default');

        return request ()
          .delete (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .expect (200, 'true')
          .then (() => {
            // There should still be an account model in the database. It should just
            // be marked as deleted.
            const Account = blueprint.lookup ('model:account');

            return Account.findById (account.id).then (account => {
              expect (account.is_deleted).to.equal (true);
            });
          });
      });

      it ('should not allow user to delete account of another user', function () {
        const {accounts} = seed ('$default');
        const account = accounts[1];

        return request ()
          .delete (`/v1/accounts/${account.id}`)
          .withUserToken (0)
          .expect (403, { errors:
            [ { code: 'invalid_account',
              detail: 'You are not the account owner.',
              status: '403' } ] });
      });
    });

    describe ('/password', function () {
      it ('should change the password', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        return request ()
          .post (`/v1/accounts/${account.id}/password`)
          .withUserToken (0)
          .send ({password: { current: account.username, new: '1aBcDeFg'}})
          .expect (200, 'true').then (() => {
            const Account = blueprint.lookup ('model:account');

            return Account.findById (account._id)
              .then (actual => {
                expect (account.password).to.not.equal (actual.password);
              });
          });
      });

      it ('should change the password because new is invalid', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        return request ()
          .post (`/v1/accounts/${account.id}/password`)
          .withUserToken (0)
          .send ({password: { current: account.username, new: 'new'}})
          .expect (403, { errors:
              [ { code: 'invalid_password',
                detail: 'The password is invalid.',
                status: '403' } ] });
      });

      it ('should not change the password because current is wrong', function () {
        const {accounts} = seed ('$default');
        const account = accounts[0];

        return request ()
          .post (`/v1/accounts/${account.id}/password`)
          .withUserToken (0)
          .send ({password: { current: 'bad-password', new: '1aBcDeFg'}})
          .expect (400, { errors:
              [ { code: 'invalid_password',
                detail: 'The current password is invalid.',
                status: '400' } ] });
      });
    });
  });

  describe ('/v1/accounts/:accountId/impersonate', function () {
    context ('POST', function () {
      it ('should impersonate an account', async function () {
        const { accounts: [, account]} = seed ();

        const res = await request ()
          .post (`/v1/accounts/${account.id}/impersonate`)
          .withUserToken (0)
          .expect (200);

        expect (res.body).to.have.property ('token_type', 'Bearer');
        expect (res.body).to.have.property ('access_token');
      });

      it ('should fail to impersonate an account', function () {
        const { accounts: [, account]} = seed ();

        return request ()
          .post (`/v1/accounts/${account.id}/impersonate`)
          .withUserToken (1)
          .expect (403, {
            errors: [
              {
                code: 'invalid_scope',
                detail: 'This request does not have a valid scope.',
                status: '403'
              }
            ]
          });
      });
    })
  });

  describe ('/v1/accounts/:accountId/verify', function () {
    context ('POST', function () {
      it.only ('should verify an account', async function () {
        const { accounts: [,account]} = seed ();

        const res = await request ()
          .post (`/v1/accounts/${account.id}/verify`)
          .withUserToken (8)
          .expect (200);

        expect (res.body).to.have.nested.property ('account.verification')
          .to.have.keys (['required', 'date', 'ip_address']);
      });

      it ('should fail because of invalid user request', function () {
        const { accounts: [, account]} = seed ();

        return request ()
          .post (`/v1/accounts/${account.id}/verify`)
          .withUserToken (1)
          .expect (403, {
            errors: [
              {
                code: 'verify_failed',
                detail: 'An account can be verified only by its owner.',
                status: '403'
              }
            ]
          });
      });
    })
  });
});