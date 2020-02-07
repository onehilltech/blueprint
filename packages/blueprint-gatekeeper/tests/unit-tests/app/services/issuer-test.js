/*
 * Copyright (c) 2019 One Hill Technologies, LLC
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
const blueprint = require ('@onehilltech/blueprint');
const { seed } = require ('@onehilltech/blueprint-mongodb');


describe ('app | services | issuer', function () {
  describe ('issueClientToken', function () {
    it ('should issue a client token', function () {
      const {
        native: [,,,,client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueClientToken (client, payload, options)
        .then (token => {
          expect (token).to.have.keys (['access_token']);

          const { access_token } = token;
          expect (access_token.split ('.').length).to.equal (3);

          return issuer.verifyToken (access_token);
        })
        .then (accessToken => {
          expect (accessToken.type).to.equal ('client_token');
          expect (accessToken.client._id).to.eql (client._id);
          expect (accessToken.scope).to.eql ([]);
          expect (accessToken.subject).to.equal ('unit-test');
          expect (accessToken.issuer).to.equal ('gatekeeper');
          expect (accessToken.payload).to.eql ({admin: true});
          expect (accessToken).to.have.property ('expiration');
        });
    });

    it ('should not issue a token for a disabled client', function () {
      const {
        native: [,,client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueClientToken (client, payload, options)
        .then (() => expect.fail ('The issuer should not have issued a token for the disabled client.'))
        .catch (reason => {
          expect (reason.message).to.equal ('The client is disabled.');
        });
    });

    it ('should not issue a token for a restricted client', function () {
      const {
        native: [,,,client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueClientToken (client, payload, options)
        .then (() => expect.fail ('The issuer should not have issued a token for the private client.'))
        .catch (reason => {
          expect (reason.message).to.equal ('The client cannot issue access tokens for anonymous users.');
        });
    });
  });

  describe ('issueUserToken', function () {
    it ('should issue a user token', function () {
      const {
        accounts: [account],
        native: [,,,,client]
      } = seed ();

      const payload = { admin: false };
      const options = { subject: 'unit-test' };

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (token => {
          expect (token).to.have.keys (['access_token', 'refresh_token']);

          const { access_token, refresh_token } = token;

          expect (access_token.split ('.').length).to.equal (3);
          expect (refresh_token).to.be.undefined;

          return Promise.all ([
            issuer.verifyToken (access_token),
            undefined
          ]);
        })
        .then (([accessToken]) => {
          expect (accessToken.type).to.equal ('user_token');
          expect (accessToken.client._id).to.eql (client._id);
          expect (accessToken.account._id).to.eql (account._id);
          expect (accessToken.scope).to.eql ([]);
          expect (accessToken.subject).to.equal ('unit-test');
          expect (accessToken.issuer).to.equal ('gatekeeper');
          expect (accessToken.payload).to.eql ({admin: false});
          expect (accessToken).to.have.property ('expiration');
        });
    });

    it ('should issue a user token that is refreshable', function () {
      const {
        accounts: [account],
        native: [,,,,client]
      } = seed ();

      const payload = { admin: false };
      const options = { subject: 'unit-test', refreshable: { subject: 'refresh'} };

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (token => {
          expect (token).to.have.keys (['access_token', 'refresh_token']);

          const { access_token, refresh_token } = token;

          expect (access_token.split ('.').length).to.equal (3);
          expect (refresh_token.split ('.').length).to.equal (3);

          return Promise.all ([
            issuer.verifyToken (access_token),
            issuer.verifyRefreshToken (refresh_token)
          ]);
        })
        .then (([accessToken, refreshToken]) => {
          expect (accessToken.client._id).to.eql (client._id);
          expect (accessToken.account._id).to.eql (account._id);
          expect (accessToken.scope).to.eql ([]);
          expect (accessToken.subject).to.equal ('unit-test');
          expect (accessToken.issuer).to.equal ('gatekeeper');
          expect (accessToken.payload).to.eql ({admin: false});
          expect (accessToken).to.have.property ('expiration');

          expect (accessToken.lean ()).to.eql (refreshToken.lean ());
        });
    });

    it ('should issue a user token for an allowed user on a restricted client', function () {
      const {
        accounts: [,,,,,,account],
        native: [,,,client]
      } = seed ();

      const payload = { admin: false };
      const options = { subject: 'unit-test', refreshable: { subject: 'refresh'} };

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (token => {
          expect (token).to.have.keys (['access_token', 'refresh_token']);

          const { access_token, refresh_token } = token;

          expect (access_token.split ('.').length).to.equal (3);
          expect (refresh_token.split ('.').length).to.equal (3);

          return Promise.all ([
            issuer.verifyToken (access_token),
            issuer.verifyRefreshToken (refresh_token)
          ]);
        })
        .then (([accessToken, refreshToken]) => {
          expect (accessToken.client._id).to.eql (client._id);
          expect (accessToken.account._id).to.eql (account._id);
          expect (accessToken.scope).to.eql ([]);
          expect (accessToken.subject).to.equal ('unit-test');
          expect (accessToken.issuer).to.equal ('gatekeeper');
          expect (accessToken.payload).to.eql ({admin: false});
          expect (accessToken).to.have.property ('expiration');

          expect (accessToken.lean ()).to.eql (refreshToken.lean ());
        });
    });

    it ('should not issue a token for a disabled account', function () {
      const {
        accounts: [,,,,account],
        native: [client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (() => expect.fail ('The issuer should not have issued a token for the disabled client.'))
        .catch (reason => {
          expect (reason.message).to.equal ('The user account is disabled.');
        });
    });

    it ('should not issue a token for a disabled client', function () {
      const {
        accounts: [account],
        native: [,,client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (() => expect.fail ('The issuer should not have issued a token for the disabled client.'))
        .catch (reason => {
          expect (reason.message).to.equal ('The client is disabled.');
        });
    });

    it ('should not issue a token for a denied account on a restricted client', function () {
      const {
        accounts: [,,,,,,account],
        native: [client]
      } = seed ();

      const payload = { admin: true};
      const options = { subject: 'unit-test'};

      let issuer = blueprint.lookup ('service:issuer');

      return issuer.issueUserToken (account, client, payload, options)
        .then (() => expect.fail ('The issuer should not have issued a token for the disabled client.'))
        .catch (reason => {
          expect (reason.message).to.equal ('The user account is not allowed to access this client.');
        });
    });
  });
});
