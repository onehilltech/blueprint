var blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , request   = require ('supertest')
  , async     = require ('async')
  ;

var datamodel = require ('../../../../../fixtures/datamodel')
  ;

describe ('Oauth2Router', function () {
  var server;

  before (function (done) {
    datamodel.apply (function (err) {
      if (err) return done (err);

      server = blueprint.app.server;
      return done (null);
    });
  });

  describe('#getToken (callback)', function () {
    var TOKEN_URL = '/v1/oauth2/token';
    var accessToken;
    var refreshToken;

    it ('password: should get a token for the username/password', function (done) {
      var data = {
        grant_type: 'password',
        username: datamodel.data.accounts[0].username,
        password: datamodel.data.accounts[0].password,
        client_id: datamodel.models.clients[0].id
      };

      request (server.app)
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

    it('password: should return 400 for missing grant_type', function (done) {
      var data = {
        username: datamodel.data.accounts[0].username,
        password: datamodel.data.accounts[0].password,
        client_id: datamodel.models.clients[0].id
      };

      request(server.app)
        .post(TOKEN_URL)
        .send(data)
        .expect(400, done);
    });

    it('password: should not grant token because client is disabled', function (done) {
      var data = {
        grant_type: 'password',
        username: datamodel.data.accounts[0].username,
        password: datamodel.data.accounts[0].password,
        client_id: datamodel.models.clients[2].id
      };

      request(server.app)
        .post(TOKEN_URL)
        .send(data)
        .expect(401, done);
    });

    it('password: should not grant token because account is disabled', function (done) {
      var data = {
        grant_type: 'password',
        username: datamodel.data.accounts[4].username,
        password: datamodel.data.accounts[4].password,
        client_id: datamodel.models.clients[0].id
      };

      request(server.app)
        .post(TOKEN_URL)
        .send(data)
        .expect(401, done);
    });

    it('password: should not grant token because password is incorrect', function (done) {
      var data = {
        grant_type: 'password',
        username: datamodel.data.accounts[0].username,
        password: 'incorrect_password',
        client_id: datamodel.models.clients[0].id
      };

      request (server.app)
        .post (TOKEN_URL)
        .send (data)
        .expect (401, done);
    });

    it('client_credentials: should get a token for client credentials', function (done) {
      var data = {
        grant_type: 'client_credentials',
        client_id: datamodel.models.clients[0].id,
        client_secret: datamodel.models.clients[0].secret
      };

      request(server.app)
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

    it('client_credentials: should not grant token because client is disabled', function (done) {
      var data = {
        grant_type: 'client_credentials',
        client_id: datamodel.models.clients[2].id,
        client_secret: datamodel.models.clients[2].secret
      };

      request(server.app)
        .post(TOKEN_URL).send(data)
        .expect(401, done);
    });

    it('client_credentials: should not grant token because invalid secret', function (done) {
      var data = {
        grant_type: 'client_credentials',
        client_id: datamodel.models.clients[0].id,
        client_secret: 'bad_secret'
      };

      request(server.app)
        .post(TOKEN_URL).send(data)
        .expect(400, done);
    });

    it ('refresh_token: should refresh the access and refresh token', function (done) {
      // Get an access and refresh token using username/password.
      var data = {
        grant_type: 'password',
        username: datamodel.data.accounts[0].username,
        password: datamodel.data.accounts[0].password,
        client_id: datamodel.models.clients[0].id
      };

      request (server.app)
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

        request(server.app)
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

          request (server.app)
            .post ('/v1/oauth2/token').send (data)
            .expect (200, callback);
        },

        function (res, callback) {
          accessToken = res.body.access_token;

          request (server.app)
            .post ('/v1/oauth2/logout')
            .set ('Authorization', 'Bearer ' + accessToken)
            .expect (200, callback);
        }
      ], done);
    });
  });
});
