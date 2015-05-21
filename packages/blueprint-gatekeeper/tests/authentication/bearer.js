var request     = require ('supertest')
  , assert      = require ('assert')
  , passport    = require ('passport')
  , mongoose    = require ('mongoose')
  , app         = require ('../app');

var Schema = mongoose.Schema;

var lib         = require ('../../libs')
  , AccessToken = lib.models.AccessToken
  , Account     = lib.models.Account
  , Client      = lib.models.Client
  ;

describe ('oauth2 strategy', function () {
  var bearer = lib.auth.bearer;
  var server;

  var tester = {
    email : 'test@me.com',
    password : '123abc'
  };

  var client = {
    name : 'client1',
    secret : 'secret',
    redirect_uri : 'http://www.testme.com',
    disabled : false
  };

  var access_token = {
    token : '1234567890',
    refresh_token : '0987654321',
    disabled : {type: Boolean, default : false}
  };

  before (function (done) {
    Account.create (tester, function (err, user) {
      if (err) return done (err);
      tester.id = user.id;

      // Set the access token user id.
      access_token.account = user.id;
      return done ();
    });
  });

  before (function (done) {
    Client.create (client, function (err, cli) {
      if (err) return done (err);
      client.id = cli.id;

      // Set the access token user id.
      access_token.client = cli.id;
      return done ();
    });
  });

  before (function (done) {
    AccessToken.create (access_token, function (err, at) {
      if (err) return done (err);
      at.id = at.id;

      return done ();
    });
  });

  before (function (done) {
    // Use the local authentication strategy.
    passport.use (bearer ());

    // Setup the different routes for testing.
    app.get ('/protected/resource', [
      passport.authenticate ('bearer', {session: false}),
      function (req, res) {
        res.send (200, {result: true});
      }]);

    // Start listening for requests.
    server = app.listen (5000);
    return done ();
  });

  after (function (done) {
    Account.remove ({}, function (err) {
      return done (err);
    });
  });

  after (function (done) {
    Client.remove ({}, function (err) {
      return done (err);
    });
  });

  after (function (done) {
    AccessToken.remove ({}, function (err) {
      return done (err);
    });
  });

  after (function () {
    server.close ();
  });

  // TEST CASES

  describe ('require', function () {
    it ('should import a function', function () {
      assert.equal ('function', typeof (bearer));
    });
  });

  describe ('authentication', function () {
    it ('should return unauthorized access', function (done) {
      request (app)
        .get ('/protected/resource')
        .expect (401, { }, done);
    });

    it ('should authenticate using access token', function (done) {
      request (app)
        .get ('/protected/resource')
        .set ('Authorization', 'Bearer ' + access_token.token)
        .expect (200, {result : true}, done);
    });
  });
});
