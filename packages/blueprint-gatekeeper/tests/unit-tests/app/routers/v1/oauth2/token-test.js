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

const { seed }    = require ('@onehilltech/blueprint-mongodb');
const { expect }  = require ('chai');
const blueprint   = require ('@onehilltech/blueprint');
const { request } = require ('@onehilltech/blueprint-testing');
const { delay } = require ('bluebird');

const TOKEN_URL = '/v1/oauth2/token';

function requestToken (data) {
  return request ().post (TOKEN_URL).send (data)
}

function getToken (data) {
  return requestToken (data)
    .expect (200)
    .expect ('Content-Type', /json/)
    .then (res => res.body);
}

describe ('app | routers | oauth2 | token', function () {
  function getTokenGenerators () {
    const gatekeeper = blueprint.lookup ('service:gatekeeper');

    return [
      gatekeeper.getTokenGenerator ('gatekeeper:access_token'),
      gatekeeper.getTokenGenerator ('gatekeeper:refresh_token')
    ]
  }

  describe ('/token', function () {
    it ('should fail because of bad grant_type', function () {
      const {native} = seed ('$default');
      const client = native[0];

      const data = {
        client_id: client.id,
        grant_type: 'a',
      };

      return request ()
        .post (TOKEN_URL)
        .send (data)
        .expect (400, { errors:
            [ { code: 'validation_failed',
              detail: 'The request validation failed.',
              status: '400',
              meta: {
                validation: {
                  grant_type: {
                    location: "body",
                    msg: "The grant type is not supported.",
                    param: "grant_type",
                    value: 'a'
                  }
                }
              } }] });
    });

    it ('should fail because client is disabled', function () {
      const {native, accounts} = seed ('$default');
      const account = accounts[0];
      const client = native[2];

      const data = {
        grant_type: 'password',
        username: account.username,
        password: account.password,
        client_id: client.id,
        client_secret: client.client_secret
      };

      return request ()
        .post (TOKEN_URL)
        .send (data)
        .expect (403, { errors:
            [ { code: 'client_disabled',
              detail: 'The client is disabled.',
              status: '403' } ] });
    });

    describe ('password', function () {
      context ('native', function () {
        it ('should grant token', function () {
          const {native,accounts} = seed ('$default');
          const account = accounts[1];
          const client = native[0];

          const data = {
            grant_type: 'password',
            username: account.username,
            password: account.username,
            client_id: client.id,
            client_secret: client.client_secret
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (token).to.have.property ('token_type', 'Bearer');
          });
        });

        it ('should fail because password is incorrect', function () {
          const {native, accounts} = seed ('$default');
          const account = accounts[1];
          const client = native[0];

          const data = {
            grant_type: 'password',
            username: account.username,
            password: 'incorrect_password',
            client_id: client.id,
            client_secret: client.client_secret
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, {errors: [{status: '400', code: 'invalid_password', detail: 'The password for the account is incorrect.'}]});
        });
      });

      context ('android', function () {
        it ('should grant token', function () {
          const {android,accounts} = seed ('$default');
          const client = android[0];
          const account = accounts[0];

          const data = {
            grant_type: 'password',
            client_id: client.id,
            client_secret: client.client_secret,
            package: 'com.onehilltech.gatekeeper',
            username: account.username,
            password: account.username,
          };

          return getToken (data).then (token => {
            expect (token).to.have.keys (['token_type','access_token','refresh_token']);
          });
        });

        it ('should fail because of invalid package', function () {
          const {android,accounts} = seed ('$default');
          const client = android[0];
          const account = accounts[0];

          const data = {
            grant_type: 'password',
            client_id: client.id,
            client_secret: client.client_secret,
            username: account.username,
            password: account.username,
            package: 'a.b'
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'invalid_package',
                  detail: 'The package does not match the client.',
                  status: '400' } ] });
        });
      });

      context ('recaptcha', function () {
        this.timeout (5000);

        it ('should grant token', function () {
          const {recaptcha,accounts} = seed ('$default');
          const client = recaptcha[0];
          const account = accounts[0];

          const data = {
            grant_type: 'password',
            client_id: client.id,
            recaptcha: 'random-response-that-always-succeeds',
            username: account.username,
            password: account.username,
          };

          return getToken (data).then (token => {
            expect (token).to.have.keys (['token_type','access_token','refresh_token']);
          });
        });

        it ('should fail because missing recaptcha response', function () {
          const {recaptcha,accounts} = seed ('$default');
          const client = recaptcha[0];
          const account = accounts[0];

          const data = {
            grant_type: 'password',
            client_id: client.id,
            username: account.username,
            password: account.username,
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'validation_failed',
                  detail: 'The request validation failed.',
                  status: '400',
                  meta: {
                    validation: {
                      recaptcha: {
                        location: "body",
                        msg: "This field is required.",
                        param: "recaptcha"
                      }
                    }
                  } } ] });
        });

        it ('should fail because verification failed', function () {
          const {
            recaptcha: [, client],
            accounts: [account]
          } = seed ();

          const data = {
            grant_type: 'password',
            client_id: client.id,
            recaptcha: 'this-is-a-random-response',
            username: account.username,
            password: account.username,
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'recaptcha_failed',
                  detail: 'Failed to verify the reCAPTCHA response.',
                  status: '400',
                  meta: {
                    'error-codes': [
                      'invalid-input-secret'
                    ]
                  } } ] });
        });
      });

      it ('should fail because account is disabled', function () {
        const {native, accounts} = seed ('$default');
        const account = accounts[4];
        const client = native[0];

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.password,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (400, { errors:
              [ { code: 'account_disabled',
                detail: 'The account is disabled.',
                status: '400' } ] });
      });

      it ('should grant token because account allowed on client', function () {
        const {
          native: [,,,client],
          accounts: [,,,,,,account]
        } = seed ('$default');

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.username,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return getToken (data).then (token => {
          expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
          expect (token).to.have.property ('token_type', 'Bearer');
        });
      });

      it ('should grant token because account not denied on client', function () {
        const {
          native: [client],
          accounts: [account]
        } = seed ('$default');

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.username,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return getToken (data).then (token => {
          expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
          expect (token).to.have.property ('token_type', 'Bearer');
        });
      });

      it ('should fail because account is not allowed on client', function () {
        const {
          native: [,,,client],
          accounts: [account]
        } = seed ('$default');

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.username,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (403, { errors:
              [ { code: 'invalid_account',
                detail: 'Your account cannot access this client.',
                status: '403' } ] });
      });

      it ('should fail because account is denied on client', function () {
        const {
          native: [client],
          accounts: [,,,,,,account]
        } = seed ('$default');

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.username,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (403, { errors:
              [ { code: 'invalid_account',
                detail: 'Your account cannot access this client.',
                status: '403' } ] });
      });

      it ('should fail because access token has expired', function () {
        this.timeout (10000);

        const {
          native: [,,,,client],
          accounts: [account]
        } = seed ('$default');

        const data = {
          grant_type: 'password',
          username: account.username,
          password: account.username,
          client_id: client.id,
          client_secret: client.client_secret
        };

        return getToken (data).then (({access_token}) => {
          // get information about myself, but the token should be expired.
          return delay (5000)
            .then (() => request ().get ('/v1/accounts/me')
              .set ('Authorization', `Bearer ${access_token}`)
              .expect (403, {
                errors:
                  [{
                    code: 'token_expired',
                    detail: 'The access token has expired.',
                    status: '403'
                  }]
              })
            );
        });
      });
    });

    describe ('client_credentials', function () {
      context ('native', function () {
        it ('should grant token', function () {
          const {native} = seed ('$default');
          const client = native[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: client.client_secret
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token']);
            expect (token).to.have.property ('token_type', 'Bearer');
          });
        });

        it ('should fail because of missing fields', function () {
          const {native} = seed ('$default');
          const client = native[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'validation_failed',
                  detail: 'The request validation failed.',
                  status: '400',
                  meta: {
                    validation: {
                      client_secret: {
                        location: 'body',
                        msg: 'This field is required.',
                        param: 'client_secret'
                      }
                    }
                  }
            } ] });
        });

        it ('should fail because of invalid client secret', function () {
          const {native} = seed ('$default');
          const client = native[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: 'bad_secret'
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'invalid_secret',
                  detail: 'The client secret is not valid.',
                  status: '400' } ] });
        });

        it ('should fail because client is disabled', function () {
          const {native} = seed ('$default');
          const client = native[2];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: client.client_secret
          };

          return request ()
            .post (TOKEN_URL)
            .send(data)
            .expect (403, { errors:
                [ { code: 'client_disabled',
                  detail: 'The client is disabled.',
                  status: '403' } ] });
        });
      });

      context ('android', function () {
        it ('should grant token', function () {
          const {android} = seed ('$default');
          const client = android[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: client.client_secret,
            package: client.package
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token']);
            expect (token).to.have.property ('token_type', 'Bearer');
          });
        });

        it ('should fail because of missing fields', function () {
          const {android} = seed ('$default');
          const client = android[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'validation_failed',
                  detail: 'The request validation failed.',
                  status: '400',
                  meta: {
                    validation: {
                      client_secret: {
                        location: 'body',
                        msg: 'This field is required.',
                        param: 'client_secret'
                      },

                      package: {
                        location: 'body',
                        msg: 'This field is required.',
                        param: 'package'
                      }
                    }
                  }
                } ] });
        });

        it ('should fail because of invalid package', function () {
          const {android} = seed ('$default');
          const client = android[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: client.client_secret,
            package: 'a.b'
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'invalid_package',
                  detail: 'The package does not match the client.',
                  status: '400' } ] });
        });

        it ('should fail because of invalid client secret', function () {
          const {android} = seed ('$default');
          const client = android[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            client_secret: 'bad_secret',
            package: client.package
          };

          return request ()
            .post (TOKEN_URL)
            .send (data)
            .expect (400, { errors:
                [ { code: 'invalid_secret',
                  detail: 'The client secret is not valid.',
                  status: '400' } ] });
        });
      });

      context ('recaptcha', function () {
        it ('should grant token', function () {
          const {recaptcha} = seed ('$default');
          const client = recaptcha[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            recaptcha: 'random-response-that-always-succeeds'
          };

          return getToken (data).then (token => {
            expect (token).to.have.keys (['token_type','access_token']);
          });
        });

        it ('should fail because missing recaptcha response', function () {
          const {recaptcha} = seed ('$default');
          const client = recaptcha[0];

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'validation_failed',
                  detail: 'The request validation failed.',
                  status: '400',
                  meta: {
                    validation: {
                      recaptcha: {
                        location: "body",
                        msg: "This field is required.",
                        param: "recaptcha"
                      }
                    }
                  } } ] });
        });

        it ('should fail because verification failed', function () {
          const {recaptcha: [, client ]} = seed ();

          const data = {
            grant_type: 'client_credentials',
            client_id: client.id,
            recaptcha: 'this-is-a-random-response'
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'recaptcha_failed',
                  detail: 'Failed to verify the reCAPTCHA response.',
                  status: '400',
                  meta: {
                    'error-codes': [
                      'invalid-input-secret'
                    ]
                  } } ] });
        });
      });
    });

    describe ('refresh_token', function () {
      // The behavior related to the refresh token is the same for all clients. We
      // can therefore execute the same unit tests for failures each client type.

      it ('should fail because of invalid refresh token', function () {
        const {native} = seed ('$default');
        const client = native[0];

        const data = {
          grant_type: 'refresh_token',
          client_id: client.id,
          client_secret: client.client_secret,
          refresh_token: 'bad-refresh-token'
        };

        return requestToken (data)
          .expect (403, { errors:
              [ { code: 'invalid_token',
                detail: 'The refresh token is invalid.',
                status: '403' } ] });
      });

      it ('should fail because refresh token does not match client', function () {
        const {native, user_tokens} = seed ('$default');
        const client = native[0];
        const {refresh_token} = user_tokens[4].serializeSync (...getTokenGenerators ());

        const data = {
          grant_type: 'refresh_token',
          client_id: client.id,
          client_secret: client.client_secret,
          refresh_token
        };

        return requestToken (data)
          .expect (403, { errors:
              [ { code: 'invalid_token',
                detail: 'The refresh token does not exist, or does not belong to the client.',
                status: '403' } ] });
      });

      it ('should fail because client is disabled', function () {
        const {native, user_tokens} = seed ('$default');
        const client = native[2];
        const {refresh_token} = user_tokens[4].serializeSync (...getTokenGenerators ());

        const data = {
          grant_type: 'refresh_token',
          client_id: client.id,
          client_secret: client.client_secret,
          refresh_token
        };

        return requestToken (data)
          .expect (403, { errors:
              [ { code: 'client_disabled',
                detail: 'The client is disabled.',
                status: '403' } ] });
      });

      it ('should fail because refresh token is disabled', function () {
        const {native, user_tokens} = seed ('$default');
        const client = native[1];
        const {refresh_token} = user_tokens[3].serializeSync (...getTokenGenerators ());

        const data = {
          grant_type: 'refresh_token',
          client_id: client.id,
          client_secret: client.client_secret,
          refresh_token
        };

        return requestToken (data)
          .expect (403, { errors:
              [ { code: 'token_disabled',
                detail: 'The refresh token is disabled.',
                status: '403' } ] });
      });

      it ('should fail because account is disabled', function () {
        const {native, user_tokens} = seed ('$default');
        const client = native[0];
        const {refresh_token} = user_tokens[5].serializeSync (...getTokenGenerators ());

        const data = {
          grant_type: 'refresh_token',
          client_id: client.id,
          client_secret: client.client_secret,
          refresh_token
        };

        return requestToken (data)
          .expect (403, { errors:
              [ { code: 'account_disabled',
                detail: 'The account is disabled.',
                status: '403' } ] });
      });

      context ('native', function () {
        it ('should refresh tokens', function () {
          const {user_tokens, native} = seed ('$default');
          const user_token = user_tokens[0];
          const client = native[0];

          const {access_token, refresh_token} = user_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            refresh_token,
            client_id: client.id,
            client_secret: client.client_secret
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            expect (access_token).to.not.equal (token.access_token);
            expect (refresh_token).to.not.equal (token.refresh_token);

            const [, refreshTokenGenerator] = getTokenGenerators ();

            // The refresh token should never expire.

            return refreshTokenGenerator.verifyToken (token.refresh_token).then (payload => {
              expect (payload.exp).to.equal (undefined);
            });
          });
        });

        it ('should fail because of missing fields', function () {
          const {native} = seed ('$default');
          const client = native[0];

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id
          };

          return requestToken (data)
            .expect (400, {
              errors: [{
                status: '400',
                code: "validation_failed",
                detail: "The request validation failed.",
                meta: {
                  validation: {
                    client_secret: {
                      location: "body",
                      msg: "This field is required.",
                      param: "client_secret"
                    },
                    refresh_token: {
                      location: "body",
                      msg: "This field is required.",
                      param: "refresh_token"
                    }
                  }
                }
              }]
            });
        });

        it ('should fail because of invalid client secret', function () {
          const {native, user_tokens} = seed ('$default');
          const client = native[0];
          const {refresh_token} = user_tokens[0].serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id,
            client_secret: 'bad-client-secret',
            refresh_token
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'invalid_secret',
                  detail: 'The client secret is not valid.',
                  status: '400' } ] });
        });
      });

      context ('android', function () {
        it ('should refresh tokens', function () {
          const {user_tokens, android} = seed ('$default');
          const user_token = user_tokens[7];
          const client = android[0];

          const {access_token, refresh_token} = user_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            refresh_token,
            client_id: client.id,
            client_secret: client.client_secret,
            package: client.package
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            expect (access_token).to.not.equal (token.access_token);
            expect (refresh_token).to.not.equal (token.refresh_token);
          });
        });

        it ('should fail because of missing fields', function () {
          const {android} = seed ('$default');
          const client = android[0];

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id
          };

          return requestToken (data)
            .expect (400, {
              errors: [{
                status: '400',
                code: "validation_failed",
                detail: "The request validation failed.",
                meta: {
                  validation: {
                    client_secret: {
                      location: "body",
                      msg: "This field is required.",
                      param: "client_secret"
                    },
                    package: {
                      location: "body",
                      msg: "This field is required.",
                      param: "package"
                    },
                    refresh_token: {
                      location: "body",
                      msg: "This field is required.",
                      param: "refresh_token"
                    }
                  }
                }
              }]
            });
        });

        it ('should fail because of invalid client secret', function () {
          const {android, user_tokens} = seed ('$default');
          const client = android[0];
          const {refresh_token} = user_tokens[0].serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id,
            client_secret: 'bad-client-secret',
            refresh_token,
            package: client.package
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'invalid_secret',
                  detail: 'The client secret is not valid.',
                  status: '400' } ] });
        });

        it ('should fail because of invalid package', function () {
          const {android, user_tokens} = seed ('$default');
          const accessToken = user_tokens[1].serializeSync (...getTokenGenerators ());
          const client = android[0];

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id,
            client_secret: client.client_secret,
            package: 'bad-package',
            refresh_token: accessToken.refresh_token
          };

          return requestToken (data)
            .withUserToken (1)
            .expect (400, { errors:
                [ { code: 'invalid_package',
                  detail: 'The package does not match the client.',
                  status: '400' } ] });
        });
      });

      context ('recaptcha', function () {
        it ('should refresh tokens', function () {
          const {user_tokens, recaptcha} = seed ('$default');
          const user_token = user_tokens[6];
          const client = recaptcha[0];

          const {access_token, refresh_token} = user_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            refresh_token,
            client_id: client.id
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            expect (access_token).to.not.equal (token.access_token);
            expect (refresh_token).to.not.equal (token.refresh_token);
          });
        });

        it ('should fail because of missing fields', function () {
          const {user_tokens} = seed ('$default');
          const user_token = user_tokens[6];
          const {refresh_token} = user_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            refresh_token,
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'validation_failed',
                  detail: 'The request validation failed.',
                  status: '400',
                  meta: {
                    validation: {
                      client_id: {
                        location: 'body',
                        msg: 'The field is required.',
                        param: 'client_id'
                      }
                    }
                  } } ] });
        });
      });
    });

    describe.only ('temp', function () {
      context ('native', function () {
        it ('should generate a temp user token', function () {
          const {user_tokens, native} = seed ();
          const user_token = user_tokens[0];
          const client = native[0];

          const { access_token } = user_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'temp',
            access_token,
            client_id: client.id,
            client_secret: client.client_secret,
            options: {
              audience: 'temp',
              expiration: '10 minutes',
              scope: ['online']
            }
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            const issuer = blueprint.lookup ('service:issuer');

            return issuer.verifyToken (token.access_token).then (accessToken => {
              expect (accessToken.audience).to.equal ('temp');
              expect (accessToken.scope).to.eql (['online']);
              expect (accessToken.expiration).to.exist;
              expect (accessToken.type).to.equal ('user_token');
            });
          });
        });

        it ('should fail because of missing fields', function () {
          const {native} = seed ('$default');
          const client = native[0];

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id
          };

          return requestToken (data)
            .expect (400, {
              errors: [{
                status: '400',
                code: "validation_failed",
                detail: "The request validation failed.",
                meta: {
                  validation: {
                    client_secret: {
                      location: "body",
                      msg: "This field is required.",
                      param: "client_secret"
                    },
                    refresh_token: {
                      location: "body",
                      msg: "This field is required.",
                      param: "refresh_token"
                    }
                  }
                }
              }]
            });
        });

        it ('should fail because of invalid client secret', function () {
          const {native, user_tokens} = seed ('$default');
          const client = native[0];
          const {refresh_token} = user_tokens[0].serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'refresh_token',
            client_id: client.id,
            client_secret: 'bad-client-secret',
            refresh_token
          };

          return requestToken (data)
            .expect (400, { errors:
                [ { code: 'invalid_secret',
                  detail: 'The client secret is not valid.',
                  status: '400' } ] });
        });
      });

      context ('client_token', function () {
        it ('should generate a temp client token', function () {
          const {client_tokens: [ , , client_token ], native: [ , client ]} = seed ();

          const { access_token } = client_token.serializeSync (...getTokenGenerators ());

          const data = {
            grant_type: 'temp',
            access_token,
            client_id: client.id,
            client_secret: client.client_secret,
            options: {
              audience: 'temp',
              expiration: '10 minutes'
            }
          };

          return getToken (data).then (token => {
            expect (token).to.have.all.keys (['token_type', 'access_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            const issuer = blueprint.lookup ('service:issuer');

            return issuer.verifyToken (token.access_token).then (accessToken => {
              expect (accessToken.audience).to.equal ('temp');
              expect (accessToken.expiration).to.exist;
              expect (accessToken.type).to.equal ('client_token');
            });
          });
        });
      })
    });
  });

  describe ('/logout', function () {
    it ('should logout the current user', function () {
     return request ()
        .post ('/v1/oauth2/logout')
        .withUserToken (0)
        .expect (200, 'true');
    });
  });
});
