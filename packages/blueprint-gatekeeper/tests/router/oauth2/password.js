 var request    = require ('supertest')
   , assert     = require ('assert')
   , passport   = require ('passport')
   , url        = require ('url')
   , winston    = require ('winston')
   ;

var seed   = require ('../../seeds/default')
  , config = require ('../../config')
  , Server = require ('../../../lib/server')
  , bearer = require ('../../../lib/authentication/bearer')
  , local  = require ('../../../lib/authentication/local')
  , oauth2 = require ('../../../lib/models/oauth2/index')
  ;

passport.use (bearer ());

var server = new Server (config);

// Use the bearer authentication strategy for these routes.
server.app.use ('/protected/data', passport.authenticate ('bearer', {session: false}));

// Create a protected resource
server.app.get ('/protected/data',
  function (req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`. It is typically used to indicate scope of the token,
    // and used in access control checks. For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json ({ id: req.user, scope: req.authInfo.scope })
  }
);

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('PasswordRouter', function () {
  var transaction, code, access_data;
  var user = seed.data.users[0];

  var client = seed.data.clients[0];
  var disabledClient = seed.data.clients[2];

  var agent = request.agent (server.app);

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

  describe ('POST /oauth2/password', function () {
    var loginClient = seed.data.clients[3];
    var user = seed.data.users[0];

    it ('should return access token for username/password', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username : user.username, password : user.password, client_id : loginClient.id})
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

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
        .send ({grant_type : 'password', username: user.username, password: '1', client_id: loginClient.id})
        .expect (401, done);
    });

    it ('should not return access token because of invalid username', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username: 'who@email.me', password: user.password, client_id: loginClient.id})
        .expect (401, done);
    });

    it ('should not return access token because client is disabled', function (done) {
      request (server.app)
        .post ('/oauth2/password')
        .send ({grant_type : 'password', username: 'who@email.me', password: user.password, client_id: loginClient.id})
        .expect (401, done);
    });
  });
});
