 var request    = require ('supertest')
   , assert     = require ('assert')
   , passport   = require ('passport')
   , winston    = require ('winston')
   ;

var seed   = require ('../../seeds/default')
  , config = require ('../../config')
  , Server = require ('../../../lib/server')
  , AccessToken = require ('../../../lib/models/oauth2/accessToken')
  ;

 describe ('RefreshTokenRouter', function () {
  var client = seed.data.clients[0];
  var user = seed.data.users[0];

  var server = new Server (config);
  var accessToken;
  var refreshToken;

  before (function (done) {
    server.start ();
    seed.seed (function (err) {
      if (err)
        return done (err);

      // Seed the database with an existing access token.
      AccessToken.generateAndSave (256, client.id, user.id, function (err, token, refresh) {
        if (err)
          return done (err);

        accessToken = token;
        refreshToken = refresh;

        return done ();
      });
    });
  });

  after (function (done) {
    seed.unseed (function (err) {
      server.stop ();
      return done (err);
    });
  });

  describe ('POST /oauth2/token', function () {
    it ('should refresh the access/refresh token', function (done) {
      request (server.app)
        .post ('/oauth2/token')
        .send ({grant_type : 'refresh_token', client_id : client.id, refresh_token: refreshToken})
        .expect (200)
        .end (function (err, res) {
          if (err)
            return done (err);

          assert (res.body.access_token, 'missing access token');
          assert.equal (res.body.access_token.length, 342, 'access token is incorrect length');

          assert (res.body.refresh_token, 'missing refresh token');
          assert.equal (res.body.refresh_token.length, 342, 'refresh token is incorrect length');

          // Save the access token for the logout test.
          accessToken = res.body.token;

          return done ();
        });
    });

    it ('should not return access token because of incorrect password', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username: user.username, password: '1', client_id: client.id})
        .expect (401, done);
    });

    it ('should not return access token because of invalid username', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username: 'who@email.me', password: user.password, client_id: client.id})
        .expect (401, done);
    });

    it ('should not return access token because client is disabled', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username: 'who@email.me', password: user.password, client_id: client.id})
        .expect (401, done);
    });
  });
});
