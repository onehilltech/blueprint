 var request = require ('supertest')
   , assert = require ('assert')
   , passport = require ('passport')
   , winston = require ('winston')
   ;

 var Server  = require ('../../lib/server')
   , lib     = require ('../../lib')
   , config  = require ('../config')
   , Account = lib.models.Account
   ;

describe ('LocalStrategy', function () {
  // Use the local authentication strategy.
  var local = lib.auth.local;
  passport.use (local ());

  var accounts = [
    { username : 'test@me.com', password : '123abc' },
    { username : 'disabled@test.me', password : 'abc123', disabled : true }
  ];

  var testAccount = accounts[0];
  var disabledAccount = accounts[1];

  // Create a server for our test cases.
  winston.info ('creating server for testing');
  var server = new Server (config);

  server.app.post ('/account/login', [
    passport.authenticate ('local', {session: false}),
    function (req, res) {
      res.send (200, {result: true});
    }]);


  before (function (done) {
    // Start the server.
    server.start ();

    // Create the test account.
    Account.create (accounts, function (err, account0, account1) {
      return done (err);
    });
  });

  after (function (done) {
    Account.remove ({}, function (err) {
      // Stop the server.
      server.stop ();

      return done (err);
    });
  });

  // TEST CASES

  describe ('require', function () {
    it ('should import a function', function () {
      assert.equal ('function', typeof (local));
    });
  });

  describe ('authentication', function () {
    it ('should authenticate the username/password', function (done) {
      request (server.app)
        .post ('/account/login')
        .send ({username: testAccount.username, password: testAccount.password})
        .expect (200, done);
    });

    it ('should return unauthorized access because username does not exist', function (done) {
      request (server.app)
        .post ('/account/login')
        .send ({username: 'unknown@user.com', password: '1234567890'})
        .expect (401, done);
    });

    it ('should return unauthorized access because of invalid password', function (done) {
      request (server.app)
        .post ('/account/login')
        .send ({username: testAccount.username, password: 'invalid'})
        .expect (401, done);
    });

    it ('should return unauthorized access because account is disabled', function (done) {
      request (server.app)
        .post ('/account/login')
        .send ({username: disabledAccount.username, password: disabledAccount.password})
        .expect (401, done);
    });
  });
});
