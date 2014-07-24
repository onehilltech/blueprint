var request = require ('supertest');
var superagent = require ('superagent');
var assert = require ('assert');

var seed = require ('../seeds/default');
var app  = require ('../app');
var auth = require ('../../lib/router/auth');

app.use (auth (app.config.router.auth));

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('router.auth', function () {
  var agent = superagent.agent ();

  before (function (done) {
    seed.seed (done);
  });

  after (function (done) {
    seed.unseed (done);
  });

  describe ('POST /auth/login', function () {
    /**
     * Test creating an event. This test case will create 4 events that
     * will be used in later test cases.
     */
    it ('should login the user', function (done) {
      user = seed.data.users[0];

      request (app)
        .post ('/auth/login')
        .send ({email: user.email, password: user.password})
        .expect (302)
        .end (function (err, res) {
          assert.equal (res.headers.location, '/');

          agent.saveCookies (res);
          done ()
        });
    });

    /**
     * Test logging in a user with an incorrect password. We should be 
     * redirected to the login page.
     */
    it ('should not login user because of incorrect password', function (done) {
      user = seed.data.users[0];

      request (app)
        .post ('/auth/login')
        .send ({email: user.email, password: '1'})
        .expect (302)
        .end (function (err, res) {
          assert.equal (res.headers.location, '/auth/login');
          done ()
        });
    });
 
    /**
     * Test logging in a user with an incorrect email address. We should be
     * redirected to the login page.
     */
    it ('should not login user because of incorrect email', function (done) {
      user = seed.data.users[0];

      request (app)
        .post ('/auth/login')
        .send ({email: 'who@email.me', password: user.password})
        .expect (302)
        .end (function (err, res) {
          assert.equal (res.headers.location, '/auth/login');
          return done ()
        });
    });
  });

  describe ('GET /auth/logout', function () {
    it ('should logout the user', function (done) {
      var req = request (app).get ('/auth/logout');
      agent.attachCookies (req);

      req.expect (302).end (function (err, res) {
        assert.equal (res.headers.location, '/auth/login');
        return done ();
      });
    });
  });
});
