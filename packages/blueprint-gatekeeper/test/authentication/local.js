 var request    = require ('supertest'),
     superagent = require ('superagent'),
     assert     = require ('assert'),
     passport   = require ('passport');

var app  = require ('../app');
var lib  = require ('../../');
var Account = lib.models.Account;

describe ('local strategy', function () {
  var local = lib.auth.local;
  var server;

  var accounts = [
    { username : 'test@me.com', password : '123abc' },
    { username : 'disabled@test.me', password : 'abc123', disabled : true }
  ];

  var testAccount = accounts[0];
  var disabledAccount = accounts[1];

  before (function (done) {
    Account.create (accounts, function (err, account0, account1) {
      return done (err);
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
    it ('should authenticate the username/password', function (done) {
      request (app)
        .post ('/account/login')
        .send ({username: testAccount.username, password: testAccount.password})
        .expect (200, done);
    });

    it ('should return unauthorized access because username does not exist', function (done) {
      request (app)
        .post ('/account/login')
        .send ({username: 'unknown@user.com', password: '1234567890'})
        .expect (401, done);
    });

    it ('should return unauthorized access because of invalid password', function (done) {
      request (app)
        .post ('/account/login')
        .send ({username: testAccount.username, password: 'invalid'})
        .expect (401, done);
    });

    it ('should return unauthorized access because account is disabled', function (done) {
      request (app)
        .post ('/account/login')
        .send ({username: disabledAccount.username, password: disabledAccount.password})
        .expect (401, done);
    });
  });
});
