 var request    = require ('supertest'),
     superagent = require ('superagent'),
     assert     = require ('assert'),
     passport   = require ('passport');

var app  = require ('../app'),
    lib  = require ('../../'),
    Account = lib.models.Account;

describe ('local strategy', function () {
  var local = lib.auth.local;
  var server;

  var tester = {
    email : 'test@me.com',
    password : '123abc'
  };

  before (function (done) {
    Account.create (tester, function (err, user) {
      if (err) return done (err);

      // Save the user's id.
      tester.id = user.id;
      return done ();
    });
  });

  before (function (done) {
    // Use the local authentication strategy.
    passport.use (local ());

    // Setup the different routes for testing.
    app.post ('/account/login', [
      passport.authenticate ('local', {session: false}),
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

  after (function () {
    server.close ();
  });

  // TEST CASES

  describe ('require', function () {
    it ('should import a function', function () {
      assert.equal ('function', typeof (local));
    });
  });

  describe ('authentication', function () {
    it ('should return unauthorized access', function (done) {
      request (app)
        .post ('/account/login')
        .send ({email: tester.email, password: 'invalid'})
        .expect (401, { }, done);
    });

    it ('should authenticate the username/password', function (done) {
      request (app)
        .post ('/account/login')
        .send ({email: tester.email, password: tester.password})
        .expect (200, {result : true}, done);
    });
  });
});
