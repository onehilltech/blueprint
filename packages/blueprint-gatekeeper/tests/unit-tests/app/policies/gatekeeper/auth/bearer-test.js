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

const blueprint   = require ('@onehilltech/blueprint');
const { seed }    = require ('@onehilltech/blueprint-mongodb');
const { request } = require ('@onehilltech/blueprint-testing');

describe ('app | policies | gatekeeper | auth | bearer', function () {
  function getTokenGenerators () {
    const gatekeeper = blueprint.lookup ('service:gatekeeper');

    return [
      gatekeeper.getTokenGenerator ('gatekeeper:access_token'),
      gatekeeper.getTokenGenerator ('gatekeeper:refresh_token')
    ];
  }

  it ('should fail because of missing access token', function () {
    return request ()
      .get ('/v1/accounts/me')
      .expect (400, { errors:
          [ { code: 'missing_token',
            detail: 'The access token is missing.',
            status: '400' } ] });
  });

  it ('should fail because of invalid scheme', function () {
    return request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bad Scheme')
      .expect (400, { errors:
          [ { code: 'invalid_scheme',
            detail: 'The authorization scheme is invalid.',
            status: '400' } ] });
  });

  it ('should fail because invalid authorization header', function () {
    return request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer')
      .expect (400, { errors:
          [ { code: 'invalid_authorization',
            detail: 'The authorization header is invalid.',
            status: '400' } ] });
  });

  it ('should fail because of invalid token', function () {
    return request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer bad-token')
      .expect (403, { errors: [{ status: '403', code: 'invalid_token', detail: 'jwt malformed' }] });
  });

  it ('should fail because of unknown access token', function () {
    const {user_tokens} = seed ('$default');
    const userToken = user_tokens[0];
    const accessToken = userToken.serializeSync (...getTokenGenerators ());

    return userToken.remove ().then (() => {
      return request ()
        .get ('/v1/accounts/me')
        .set ('Authorization', 'Bearer ' + accessToken.access_token)
        .expect (403, { errors:
            [ { code: 'unknown_token',
              detail: 'The access token is unknown.',
              status: '403' } ] });
    });
  });

  it ('should fail because access token disabled', function () {
    return request ()
      .get ('/v1/accounts/me')
      .withUserToken (3)
      .expect (403, { errors: [{ status: '403', code: 'token_disabled', detail: 'The access token is disabled.' }] });
  });

  it ('should fail because of unknown client', function () {
    const {user_tokens,native} = seed ('$default');
    const accessToken = user_tokens[0].serializeSync (...getTokenGenerators ());
    const client = native[0];

    return client.remove ().then (() => {
      return request ()
        .get ('/v1/accounts/me')
        .set ('Authorization', `Bearer ${accessToken.access_token}`)
        .expect (403, { errors:
            [ { code: 'unknown_client',
              detail: 'The client is unknown.',
              status: '403' } ] });
    });
  });

  it ('should fail because client disabled', function () {
    const {native} = seed ('$default');
    const client = native[0];

    client.enabled = false;

    return client.save ().then (() => {
      return request ()
        .get ('/v1/accounts/me')
        .withUserToken (0)
        .expect (403, { errors:
            [ { code: 'client_disabled',
              detail: 'The client is disabled.',
              status: '403' } ] });
    });
  });

  it ('should fail because of unknown account', function () {
    const {accounts} = seed ('$default');
    const account = accounts[0];

    return account.remove ().then (() => {
      return request ()
        .get ('/v1/accounts/me')
        .withUserToken (0)
        .expect (403, { errors:
            [ { code: 'unknown_account',
              detail: 'The account is unknown.',
              status: '403' } ] });
    });
  });

  it ('should fail because account is disabled', function () {
    return request ()
      .get ('/v1/accounts/me')
      .withUserToken (5)
      .expect (403, { errors:
          [ { code: 'account_disabled',
            detail: 'The account is disabled.',
            status: '403' } ] });
  });

  it.only ('should fail because of max usage limit', function () {
    return request ()
      .get ('/v1/accounts/me')
      .withUserToken (9)
      .expect (403, { errors:
          [ { code: 'max_usage',
            detail: 'The access token has reached its max usage.',
            status: '403' } ] });
  });
});