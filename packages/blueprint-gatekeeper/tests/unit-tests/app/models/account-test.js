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
const {seed} = require ('@onehilltech/blueprint-mongodb');
const {expect} = require ('chai');

describe ('app | models | account', function () {
  describe ('create', function () {
    it ('should create and save a new account to the database', function () {
      const Account = blueprint.lookup ('model:account');
      const {native} = seed ('$default');

      let account = new Account ({
        email: 'test-account@gatekeeper.com',
        username: 'test-account',
        password: 'test-account'
      });

      account.created_by = native[0]._id;

      return account.save ().then (model => {
        expect (model.password).to.not.equal ('test-account');

        expect (model.lean ()).to.eql ({
          _id: model.id,
          username: account.username,
          email: account.email,
          enabled: true,
          scope: [],
          verification: {
            required: true
          }
        });
      });
    });
  });

  describe ('client_id', function () {
    it ('should get the client id virtual property', function () {
      let {accounts} = seed ('$default');

      expect (accounts[0].client_id).to.eql (accounts[0].created_by);
    });
  });

  describe ('verifyPassword', function () {
    it ('should verify the password', function () {
      let {accounts} = seed ('$default');
      let account = accounts[0];

      return account.verifyPassword ('account1').then (result => {
        expect (result).to.be.true;
      });
    });

    it ('should not verify the password', function () {
      let {accounts} = seed ('$default');
      let account = accounts[0];

      return account.verifyPassword ('bad').then (result => {
        expect (result).to.be.false;
      });
    });
  });

  describe ('authenticate', function () {
    it ('should authenticate an account', function () {
      let Account = blueprint.lookup ('model:account');
      let {accounts} = seed ('$default');

      return Account.authenticate ('account1', 'account1').then (account => {
        expect (account._id).to.eql (accounts[0]._id);
      });
    });

    it ('should not find the account', function () {
      let Account = blueprint.lookup ('model:account');

      return Account.authenticate ('unknown', 'bad')
        .then (account => {
          expect (account).to.be.undefined;
        })
        .catch (err => {
          expect (err.message).to.equal ('The account does not exist.')
        });
    });

    it ('should have a invalid password', function () {
      let Account = blueprint.lookup ('model:account');

      return Account.authenticate ('account1', 'bad')
        .then (account => {
          expect (account).to.be.undefined;
        })
        .catch (err => {
          expect (err.message).to.equal ('The password is invalid.')
        });
    });
  });
});