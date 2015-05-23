 var request    = require ('supertest')
   , assert     = require ('assert')
   , passport   = require ('passport')
   , url        = require ('url')
   , winston    = require ('winston')
   ;

var seed   = require ('../seeds/default')
  , config = require ('../config')
  , Server = require ('../../lib/server')
  , bearer = require ('../../lib/authentication/bearer')
  , local  = require ('../../lib/authentication/local')
  , oauth2 = require ('../../lib/models/oauth2')
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

describe ('AuthorizationCodeRouter', function () {
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

  describe.skip ('POST /oauth2/login', function () {
    it ('should login the user for OAuth2.0 initiation', function (done) {
      agent
        .post ('/oauth2/login')
        .send ({username : user.username, password : user.password, client_id : client.id, client_secret : client.secret})
        .expect (200, done);
    });
  });

  describe.skip ('POST /oauth2/authorize', function () {
    it ('should return the transaction id, user, and client of the request', function (done) {
      agent
        .get ('/oauth2/authorize')
        .query ({response_type: 'code', client_id : client.id, redirect_uri: client.redirect_uri})
        .expect (200)
        .end (function (err, res) {
          if (err) 
            return done (err);

          // Make sure we have a transaction id of the correct length.
          var body = res.body;
          transaction = body.transactionID;
          assert.equal (8, transaction.length);

          assert.equal (user.id, body.user.id);
          assert.equal (user.username, body.user.username);

          assert.equal (client.id, body.client.id);
          assert.equal (client.name, body.client.name);

          // Save the cookies for the next request.
          return done ();
        });
    });

    it ('should return a bad request since client is disabled', function (done) {
      agent
        .get ('/oauth2/authorize')
        .query ({response_type: 'code', client_id: disabledClient.id, redirect_uri: disabledClient.redirect_uri})
        .expect (500, done);
    });
  });

  describe.skip ('POST /oauth2/decision', function () {
    it ('should return a code as part of the redirect uri', function (done) {
      agent
        .post ('/oauth2/decision')
        .send ({transaction_id: transaction})
        .expect (302)
        .end (function (err, res) {
          if (err) 
            return done (err);

          // Save the code portion of the URI.
          var uri = url.parse (res.headers.location, true);
          code = uri.query.code;

          // Validate the redirect URI, and save the cookies.
          assert.equal (seed.data.clients[0].redirect_uri + uri.search, uri.href);
          agent.saveCookies (res);

          // Save the cookies for the next request.
          return done ();
        });
    });
  });

  describe.skip ('POST /oauth2/token', function () {
    it ('should return an access token', function (done) {
      var data = {
        client_id: client.id,
        client_secret: client.secret, 
        grant_type: 'code',
        code: code, 
        redirect_uri: client.redirect_uri
      };

      request (server.app)
        .post ('/oauth2/token')
        .send (data)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          access_data = res.body;
          assert.equal ('Bearer', access_data.token_type);
          assert.equal (256, access_data.access_token.length);
          assert.equal (256, access_data.refresh_token.length);

          // Save the cookies for the next request.
          return done ();
        });
    });

    it ('should access protected resource', function (done) {
      request (server.app)
        .get ('/protected/data')
        .set ('Authorization', 'Bearer ' + access_data.access_token)
        .expect (200, {id : user.id, scope: '*'}, done);
    });

    it ('should not access protected resource (reason: missing token)', function (done) {
      request (server.app)
        .get ('/protected/data')
        .expect (401, done);
    });

    it ('should return refresh the access token', function (done) {
      var data = {
        client_id: client.id,
        client_secret: client.secret, 
        grant_type: 'refresh_token',
        refresh_token: access_data.refresh_token
      };

      request (server.app)
        .post ('/oauth2/token')
        .send (data)
        .expect (200)
        .end (function (err, res) {
          if (err)
            return done (err);

          access_data = res.body;
          assert.equal ('Bearer', access_data.token_type);
          assert.equal (256, access_data.access_token.length);
          assert.equal (256, access_data.refresh_token.length);

          // Save the cookies for the next request.
          return done ();
        });
    });
  });
});
