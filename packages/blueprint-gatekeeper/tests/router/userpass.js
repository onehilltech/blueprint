var request = require ('supertest')
  , assert = require ('assert')
  , winston = require ('winston')
  ;

var seed     = require ('../seeds/default')
  , config   = require ('../config')
  , Server   = require ('../../lib/server')
  ;

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('UsernamePasswordRouter', function () {
  var accessToken;
  var server = new Server (config);

  before (function (done) {
    server.start ();
    seed.seed (done);
  });

  after (function (done) {
    seed.unseed (function (err) {
      server.stop ();
      return done (err);
    });
  });

  describe ('POST /auth/login', function () {
    var loginClient = seed.data.clients[3];
    var user = seed.data.users[0];

    /**
     * Test creating an event. This test case will create 4 events that
     * will be used in later test cases.
     */
    it ('should login the user', function (done) {
      var data = {
        username: user.username,
        password: user.password,
        client_id: loginClient.id,
        client_secret: loginClient.secret
      };

      request (server.app)
        .post ('/auth/login')
        .send (data)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          assert.equal (res.body.token.length, 256);
          assert.equal (res.body.refresh_token.length, 256);

          // Save the access token for the logout test.
          accessToken = res.body.token;

          return done ();
        });
    });

    /**
     * Test logging in a user with an incorrect password. We should be 
     * redirected to the login page.
     */
    it ('should not login user because of incorrect password', function (done) {
      request (server.app)
        .post ('/auth/login')
        .send ({username: user.username, password: '1', client: loginClient.id, client_secret: loginClient.secret})
        .expect (401, done);
    });
 
    /**
     * Test logging in a user with an incorrect email address. We should be
     * redirected to the login page.
     */
    it ('should not login user because of invalid username', function (done) {
      request (server.app)
        .post ('/auth/login')
        .send ({username: 'who@email.me', password: user.password, client: loginClient.id, client_secret: loginClient.secret})
        .expect (401, done);
    });
  });

  describe ('POST /auth/logout', function () {
    it ('should should not logout user because of missing token', function (done) {
      request (server.app)
        .post ('/auth/logout')
        .expect (401, done);
    });

    it ('should logout the user', function (done) {
      request (server.app)
        .post ('/auth/logout')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (200, done);
    });

    it ('should not logout user twice', function (done) {
      request (server.app)
        .post ('/auth/logout')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (401, done);
    });
  });
});
