 var request    = require ('supertest'),
     superagent = require ('superagent'),
     assert     = require ('assert'),
     seed       = require ('../../seeds/default'),
     mayipass   = require ('../../../');

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('routes.v1.auth', function () {
  var agent = superagent.agent ();

  before (function (done) {
    seed.seed (done);
  });

  after (function (done) {
    seed.unseed (done);
  });

  describe ('POST /v1/auth/login', function () {
    /**
     * Test creating an event. This test case will create 4 events that
     * will be used in later test cases.
     */
    it ('should login the user', function (done) {
      user = seed.data.users[0];

      request (mayipass.server)
        .post ('/v1/auth/login')
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

      request (mayipass.server)
        .post ('/v1/auth/login')
        .send ({email: user.email, password: '1'})
        .expect (302)
        .end (function (err, res) {
          assert.equal (res.headers.location, '/v1/auth/login');
          done ()
        });
    });
 
    /**
     * Test logging in a user with an incorrect email address. We should be
     * redirected to the login page.
     */
    it ('should not login user because of incorrect email', function (done) {
      user = seed.data.users[0];

      request (mayipass.server)
        .post ('/v1/auth/login')
        .send ({email: 'who@email.me', password: user.password})
        .expect (302)
        .end (function (err, res) {
          assert.equal (res.headers.location, '/v1/auth/login');
          done ()
        });
    });
  });

  describe ('GET /v1/auth/logout', function () {
    it ('should logout the user', function (done) {
      var req = request (mayipass.server).get ('/v1/auth/logout');
      agent.attachCookies (req);

      req.expect (302).end (function (err, res) {
          assert.equal (res.headers.location, '/v1/auth/login');
          done ()
      });
    });
  });
});
