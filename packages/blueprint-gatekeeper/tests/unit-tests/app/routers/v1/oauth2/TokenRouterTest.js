'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , expect      = require ('chai').expect
  , async       = require ('async')
  ;

function getToken (data, callback) {
  blueprint.testing.request ()
    .post ('/v1/oauth2/token')
    .send (data)
    .expect (200).expect('Content-Type', /json/)
    .end (function (err, res) {
      return callback (err, err ? null : res.body);
    });
}

describe ('Oauth2Router', function () {
  describe('#issueToken', function () {
    const TOKEN_URL = '/v1/oauth2/token';

    describe ('password', function () {
      it ('should get a token for the username/password', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'password',
          username: blueprint.app.seeds.$default.accounts[1].username,
          password: blueprint.app.seeds.$default.accounts[1].username,
          client_id: native.id,
          client_secret: native.client_secret
        };

        async.waterfall ([
          function (callback) {
            getToken (data, callback);
          },

          function (token, callback) {
            expect (token).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            return callback (null);
          }
        ], done);
      });

      it ('should return 400 for missing grant_type', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          username: blueprint.app.seeds.$default.accounts[0].username,
          password: blueprint.app.seeds.$default.accounts[0].password,
          client_id: native.id,
          client_secret: native.client_secret
        };


        blueprint.testing.request()
          .post (TOKEN_URL)
          .send (data)
          .expect (400, done);
      });

      it ('should not grant token because client is disabled', function (done) {
        const native = blueprint.app.seeds.$default.native[2];

        const data = {
          grant_type: 'password',
          username: blueprint.app.seeds.$default.accounts[0].username,
          password: blueprint.app.seeds.$default.accounts[0].password,
          client_id: native.id,
          client_secret: native.client_secret
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (403, {errors: [{status: '403', code: 'client_disabled', detail: 'Client is disabled'}]}, done);
      });

      it ('should not grant token because account is disabled', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'password',
          username: blueprint.app.seeds.$default.accounts[4].username,
          password: blueprint.app.seeds.$default.accounts[4].password,
          client_id: native.id,
          client_secret: native.client_secret
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (403, {errors: [{status: '403', code: 'policy_failed', detail: 'Account is disabled'}]}, done);
      });

      it ('should not grant token because password is incorrect', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'password',
          username: blueprint.app.seeds.$default.accounts[1].username,
          password: 'incorrect_password',
          client_id: native.id,
          client_secret: native.client_secret
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (400, {errors: [{status: '400', code: 'invalid_password', detail: 'Incorrect password'}]}, done);
      });
    });

    describe ('client_credentials', function () {
      it ('should get a token for client credentials', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'client_credentials',
          client_id: native.id,
          client_secret: native.client_secret
        };

        async.waterfall ([
          function (callback) {
            getToken (data, callback);
          },

          function (token, callback) {
            expect (token).to.have.all.keys (['token_type', 'access_token']);
            expect (token).to.have.property ('token_type', 'Bearer');

            return callback (null);
          }
        ], done);
      });

      it ('should not grant token because client is disabled', function (done) {
        const native = blueprint.app.seeds.$default.native[2];

        const data = {
          grant_type: 'client_credentials',
          client_id: native.id,
          client_secret: native.client_secret
        };

        blueprint.testing.request ()
          .post(TOKEN_URL).send(data)
          .expect (403, {errors: [{status: '403', code: 'client_disabled', detail: 'Client is disabled'}]}, done);
      });

      it ('should not grant token because incorrect secret', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'client_credentials',
          client_id: native.id,
          client_secret: 'bad_secret'
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (403, {errors: [{status: '403', code: 'incorrect_secret', detail: 'Incorrect client secret'}]}, done);
      });
    });

    describe ('refresh_token', function () {
      it ('should refresh the access and refresh token', function (done) {
        const native = blueprint.app.seeds.$default.native[0];

        async.waterfall ([
          function (callback) {
            const data = {
              grant_type: 'password',
              username: blueprint.app.seeds.$default.accounts[1].username,
              password: blueprint.app.seeds.$default.accounts[1].username,
              client_id: native.id,
              client_secret: native.client_secret
            };

            getToken (data, callback);
          },

          function (accessToken, callback) {
            async.waterfall ([
              function (callback) {
                const data = {
                  grant_type: 'refresh_token',
                  client_id: native.id,
                  client_secret: native.client_secret,
                  refresh_token: accessToken.refresh_token
                };

                getToken (data, callback);
              },

              function (refreshToken, callback) {
                expect (refreshToken).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
                expect (refreshToken).to.have.property ('token_type', 'Bearer');

                expect (refreshToken.access_token).to.not.equal (accessToken.access_token);
                expect (refreshToken.refresh_token).to.not.equal (accessToken.refresh_token);

                return callback (null);
              }
            ], callback);
          }
        ], done);
      });

      it ('should not refresh token because missing secret', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[1].serializeSync ();
        const native = blueprint.app.seeds.$default.native[0];

        const data = {
          grant_type: 'refresh_token',
          client_id: native.id,
          refresh_token: accessToken.refresh_token
        };

        blueprint.testing.request()
          .post (TOKEN_URL)
          .send (data)
          .withUserToken (1)
          .expect (400, {
            errors: [{
              status: '400',
              code: "validation_failed",
              detail: "Request validation failed",
              meta: {
                validation: {
                  client_secret: {
                    location: "body",
                    msg: "Missing client secret",
                    param: "client_secret"
                  }
                }
              }
            }]
          }, done);
      });
    });
  });

  describe('/v1/oauth2/logout', function () {
    it ('should logout the current user', function (done) {
      blueprint.testing.request ()
        .post ('/v1/oauth2/logout')
        .withUserToken (0)
        .expect (200, 'true', done);
    });
  });
});
