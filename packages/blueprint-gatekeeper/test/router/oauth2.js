 var request    = require ('supertest'),
     superagent = require ('superagent'),
     assert     = require ('assert'),
     passport   = require ('passport'),
     url        = require ('url');

var seed   = require ('../seeds/default'),
    app    = require ('../app'),
    bearer = require ('../../lib/authentication/bearer'),
    auth   = require ('../../lib/router/auth'),
    oauth2 = require ('../../lib/router/oauth2');

// Add OAuth 2.0 support to the application for testing.
app.use (oauth2 ());

// Use the bearer authentication strategy for these routes.
passport.use (bearer ());
app.use ('/protected/data', passport.authenticate ('bearer', {session: false}));

// Create a protected resource
app.get ('/protected/data',
  function (req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`. It is typically used to indicate scope of the token,
    // and used in access control checks. For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json ({ id: req.user._id, name: req.user.email, scope: req.authInfo.scope })
  }
);

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('routes.v1.auth', function () {
  var agent = superagent.agent ();
  var transaction, code, access_data;
  var user = seed.data.users[0];

  before (function (done) {
    // Seed the database, then login the first user.
    seed.seed (function (err) {
      if (err)
        return done (err);

      request (app)
        .post ('/auth/login')
        .send ({email: user.email, password: user.password})
        .end (function (err, res) {
          if (err) return done (err);

          agent.saveCookies (res);
          return done ()
        });      
    });
  });

  after (function (done) {
    // Logout the first user, then unseed the database.
    var req = request (app).get ('/auth/logout');
    agent.attachCookies (req);

    req.end (function (err, res) {
      if (err) return done (err);

      return seed.unseed (done);
    });
  });

  /**
   * Unit tests for /oauth2/authorize
   */
  describe ('POST /oauth2/authorize', function () {
    it ('should return the transaction id, user, and client of the request', function (done) {
      var req = request (app).get ('/oauth2/authorize');
      agent.attachCookies (req);

      var client = seed.data.clients[0];

      req.query ({response_type: 'code', client_id: client._id, redirect_uri: client.redirect_uri})
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);
          agent.saveCookies (res);

          // Make sure we have a transaction id of the correct length.
          var body = res.body;
          transaction = body.transactionID;
          assert.equal (8, transaction.length);

          assert.equal (user._id, body.user._id);
          assert.equal (user.email, body.user.email);

          assert.equal (client._id, body.client._id);
          assert.equal (client.name, body.client.name);

          // Save the cookies for the next request.
          return done ();
        });
    });

    it ('should return a bad request since client is disabled', function (done) {
      var req = request (app).get ('/oauth2/authorize');
      agent.attachCookies (req);

      var client = seed.data.clients[2];

      req.query ({response_type: 'code', client_id: client._id, redirect_uri: client.redirect_uri})
         .expect (500, done);
    });
  });

  /**
   * Unit tests for /oauth2/decision
   */
  describe ('POST /oauth2/decision', function () {
    it ('should return a code as part of the redirect uri', function (done) {
      var req = request (app).post ('/oauth2/decision');
      agent.attachCookies (req);

      req.send ({transaction_id: transaction})
        .expect (302)
        .end (function (err, res) {
          if (err) return done (err);

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

  /**
   * Unit tests for /oauth2/token
   */
  describe ('POST /oauth2/token', function () {
    it ('should return an access token', function (done) {
      var client = seed.data.clients[0];

      var data = {
        client_id: client._id,
        client_secret: client.secret, 
        grant_type: 'code',
        code: code, 
        redirect_uri: client.redirect_uri
      };

      request (app).post ('/oauth2/token')
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
      request (app)
        .get ('/protected/data')
        .set ('Authorization', 'Bearer ' + access_data.access_token)
        .expect (200, {id : user._id, name: user.email, scope: '*'}, done);
    });

    it ('should not access protected resource (reason: missing token)', function (done) {
      request (app)
        .get ('/protected/data')
        .expect (401, done);
    });

    it ('should return refresh the access token', function (done) {
      var client = seed.data.clients[0];

      var data = {
        client_id: client._id,
        client_secret: client.secret, 
        grant_type: 'refresh_token',
        refresh_token: access_data.refresh_token
      };

      request (app).post ('/oauth2/token')
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
  });
});
