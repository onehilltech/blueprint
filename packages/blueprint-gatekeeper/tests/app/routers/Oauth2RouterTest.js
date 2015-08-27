var blueprint = require ('blueprint')
  , expect    = require ('chai').expect
  , request   = require ('supertest')
  ;

var datamodel = require ('../../fixtures/datamodel')
  ;

describe ('Oauth2Controller', function () {
  var app;

  before (function (done) {
    app = blueprint.app.server;
    blueprint.app.database.connect (done);
  });

  beforeEach (function (done) {
    datamodel.apply (done);
  });

  describe ('#getToken (callback)', function (done) {
    const TARGET_URL = '/oauth2/token';

    var accessToken;
    var refreshToken;

    it ('password: should get a token for the username/password', function (done) {
      var data = {
        grant_type : 'password',
        username   : datamodel.rawModels.accounts[0].username,
        password   : datamodel.rawModels.accounts[0].password,
        client_id  : datamodel.models.clients[0].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (200).expect ('Content-Type', /json/)
        .end (function (err, res) {
          if (err)
            return done (err);

          expect (res.body).to.have.all.keys (['token_type', 'access_token', 'refresh_token', 'expires_in']);
          expect (res.body).to.have.property ('token_type', 'Bearer');

          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;

          return done ();
      });
    });

    it ('password: should return 400 for missing grant_type', function (done) {
      var data = {
        username   : datamodel.rawModels.accounts[0].username,
        password   : datamodel.rawModels.accounts[0].password,
        client_id  : datamodel.models.clients[0].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (400, done);
    });

    it ('password: should not grant token because client is disabled', function (done) {
      var data = {
        grant_type : 'password',
        username   : datamodel.rawModels.accounts[0].username,
        password   : datamodel.rawModels.accounts[0].password,
        client_id  : datamodel.models.clients[2].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (401, done);
    });

    it ('password: should not grant token because account is disabled', function (done) {
      var data = {
        grant_type : 'password',
        username   : datamodel.rawModels.accounts[4].username,
        password   : datamodel.rawModels.accounts[4].password,
        client_id  : datamodel.models.clients[0].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (401, done);
    });

    it ('password: should not grant token because password is incorrect', function (done) {
      var data = {
        grant_type : 'password',
        username   : datamodel.rawModels.accounts[0].username,
        password   : 'incorrect_password',
        client_id  : datamodel.models.clients[0].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (401, done);
    });

    it ('client_credentials: should get a token for client credentials', function (done) {
      var data = {
        grant_type : 'client_credentials',
        client_id : datamodel.models.clients[0].id,
        client_secret : datamodel.models.clients[0].secret
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (200).expect ('Content-Type', /json/)
        .end (function (err, res) {
        if (err)
          return done (err);

        expect (res.body).to.have.all.keys (['token_type', 'access_token', 'expires_in']);
        expect (res.body).to.have.property ('token_type', 'Bearer');

        return done ();
      });
    });

    it ('client_credentials: should not grant token because client is disabled', function (done) {
      var data = {
        grant_type : 'client_credentials',
        client_id : datamodel.models.clients[2].id,
        client_secret : datamodel.models.clients[2].secret
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (401, done);
    });

    it ('client_credentials: should not grant token because invalid secret', function (done) {
      var data = {
        grant_type : 'client_credentials',
        client_id : datamodel.models.clients[0].id,
        client_secret : 'bad_secret'
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (400, done);
    });

    it ('refresh_token: should refresh the access and refresh token', function (done) {
      // Get an access and refresh token using username/password.
      var data = {
        grant_type : 'password',
        username   : datamodel.rawModels.accounts[0].username,
        password   : datamodel.rawModels.accounts[0].password,
        client_id  : datamodel.models.clients[0].id
      };

      request (app)
        .post (TARGET_URL).send (data)
        .expect (200).expect ('Content-Type', /json/)
        .end (function (err, res) {
          if (err)
            return done (err);

          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;

          data = {
            grant_type : 'refresh_token',
            client_id : datamodel.models.clients[0].id,
            refresh_token : refreshToken
          };

          request (app)
            .post (TARGET_URL).send (data)
            .expect (200).expect ('Content-Type', /json/)
            .end (function (err, res) {
              if (err)
                return done (err);

              expect (res.body).to.have.all.keys (['token_type', 'access_token', 'refresh_token', 'expires_in']);
              expect (res.body).to.have.property ('token_type', 'Bearer');

              expect (res.body.access_token).to.not.equal (accessToken);
              expect (res.body.refresh_token).to.not.equal (refreshToken);

              return done ();
          });
      });
    });
  });
});