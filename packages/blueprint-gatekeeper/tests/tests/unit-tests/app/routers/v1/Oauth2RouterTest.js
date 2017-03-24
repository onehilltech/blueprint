var blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../../../fixtures/datamodel')
  ;

describe ('Oauth2Router', function () {
  before (function (done) {
    datamodel.apply (done);
  });

  describe('#issueToken', function () {
    var TOKEN_URL = '/v1/oauth2/token';
    var accessToken;
    var refreshToken;

    describe ('password', function () {
      it ('should get a token for the username/password', function (done) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (200).expect('Content-Type', /json/)
          .end (function (err, res) {
            if (err) return done(err);

            expect (res.body).to.have.all.keys (['token_type', 'access_token', 'refresh_token']);
            expect (res.body).to.have.property ('token_type', 'Bearer');

            accessToken = res.body.access_token;
            refreshToken = res.body.refresh_token;

            return done();
          });
      });

      it ('should return 400 for missing grant_type', function (done) {
        var data = {
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        blueprint.testing.request()
          .post(TOKEN_URL)
          .send(data)
          .expect(400, done);
      });

      it ('should not grant token because client is disabled', function (done) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[2].id
        };

        blueprint.testing.request()
          .post(TOKEN_URL)
          .send(data)
          .expect (403, {errors: {code: 'client_disabled', message: 'Client is disabled'}}, done);
      });

      it ('should not grant token because account is disabled', function (done) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[4].username,
          password: datamodel.data.accounts[4].password,
          client_id: datamodel.models.clients[0].id
        };

        blueprint.testing.request()
          .post(TOKEN_URL)
          .send(data)
          .expect (403, {errors: {code: 'policy_failed', message: 'Account is disabled'}}, done);
      });

      it ('should not grant token because password is incorrect', function (done) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: 'incorrect_password',
          client_id: datamodel.models.clients[0].id
        };

        blueprint.testing.request ()
          .post (TOKEN_URL)
          .send (data)
          .expect (400, {errors: {code: 'invalid_password', message: 'Incorrect password'}}, done);
      });
    });

    describe ('client_credentials', function () {
      it ('should get a token for client credentials', function (done) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: datamodel.models.clients[0].secret
        };

        blueprint.testing.request ()
          .post(TOKEN_URL).send(data)
          .expect(200).expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err)
              return done(err);

            expect(res.body).to.have.all.keys(['token_type', 'access_token']);
            expect(res.body).to.have.property('token_type', 'Bearer');

            return done();
          });
      });

      it ('should not grant token because client is disabled', function (done) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[2].id,
          client_secret: datamodel.models.clients[2].secret
        };

        blueprint.testing.request ()
          .post(TOKEN_URL).send(data)
          .expect (403, {errors: {code: 'client_disabled', message: 'Client is disabled'}}, done);
      });

      it ('should not grant token because invalid secret', function (done) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: 'bad_secret'
        };

        blueprint.testing.request ()
          .post(TOKEN_URL).send(data)
          .expect (400, {errors: {code: 'incorrect_secret', message: 'Client secret is incorrect'}}, done);
      });
    });

    describe ('refresh_token', function () {
      it ('should refresh the access and refresh token', function (done) {
        // Get an access and refresh token using username/password.
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        blueprint.testing.request ()
          .post(TOKEN_URL).send(data)
          .expect(200).expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err)
              return done(err);

            accessToken = res.body.access_token;
            refreshToken = res.body.refresh_token;

            data = {
              grant_type: 'refresh_token',
              client_id: datamodel.models.clients[0].id,
              refresh_token: refreshToken
            };

            blueprint.testing.request ()
              .post(TOKEN_URL).send(data)
              .expect(200).expect('Content-Type', /json/)
              .end(function (err, res) {
                if (err)
                  return done(err);

                expect (res.body).to.have.all.keys(['token_type', 'access_token', 'refresh_token']);
                expect (res.body).to.have.property('token_type', 'Bearer');

                expect (res.body.access_token).to.not.equal (accessToken);
                expect (res.body.refresh_token).to.not.equal (refreshToken);

                return done();
              });
          });
      });
    });
  });

  describe('#logoutUser (callback)', function () {
    var accessToken;

    it ('should logout the current user', function (done) {
      async.waterfall ([
        function (callback) {
          var data = {
            grant_type: 'password',
            username: datamodel.data.accounts[0].username,
            password: datamodel.data.accounts[0].password,
            client_id: datamodel.models.clients[0].id
          };

          blueprint.testing.request ()
            .post ('/v1/oauth2/token').send (data)
            .expect (200, callback);
        },

        function (res, callback) {
          accessToken = res.body.access_token;

          blueprint.testing.request ()
            .post ('/v1/oauth2/logout')
            .set ('Authorization', 'Bearer ' + accessToken)
            .expect (200, callback);
        }
      ], done);
    });
  });
});
