# Supertest sessions

Session wrapper around supertest.

[![Build
Status](https://travis-ci.org/rjz/supertest-session.svg?branch=master)](https://travis-ci.org/rjz/supertest-session)
[![Coverage
Status](https://coveralls.io/repos/rjz/supertest-session/badge.png)](https://coveralls.io/r/rjz/supertest-session)

References:

  * https://gist.github.com/joaoneto/5152248
  * https://github.com/visionmedia/supertest/issues/46
  * https://github.com/visionmedia/supertest/issues/26

## Test

    $ npm test

## Usage

Require `supertest-session` and pass in the test application:

    var Session = require('supertest-session')({
      app: require('../../path/to/app')
    });

You can set environmental variables by including an `envs` object:

    var Session = require('supertest-session')({
      app: require('../../path/to/app'),
      envs: { NODE_ENV: 'development' }
    });

Set up a session:

    before(function () {
      this.sess = new Session();
    });

    after(function () {
      this.sess.destroy();
    });

And set some expectations:

    it('should fail accessing a restricted page', function (done) {
      this.sess.get('/restricted')
        .expect(401)
        .end(done)
    });

    it('should sign in', function (done) {
      this.sess.post('/signin')
        .send({ username: 'foo', password: 'password' })
        .expect(200)
        .end(done);
    });

    it('should get a restricted page', function (done) {
      this.sess.get('/restricted')
        .expect(200)
        .end(done)
    });

### Accessing session data

The cookies attached to the session may be retrieved from `session.cookies` at any time, for instance to inspect the contents of the current session in an external store.

    it('should set session details correctly', function (done) {
      var sessionCookie = _.find(sess.cookies, function (cookie) {
        return _.has(cookie, 'connect.sid');
      });

      memcached.get(sessionCookie['connect.sid'], function (err, session) {
        session.user.name.should.eq('Foobar');
        done();
      });
    });

### Request hooks

By default, supertest-session authenticates using session cookies. If your app
uses a custom strategy to restore sessions, you can provide `before` and `after`
hooks to adjust the request and inspect the response:

    var Session = require('supertest-session')({
      app: require('../../path/to/app'),
      before: function (req) {
        req.set('authorization', 'Basic aGVsbG86d29ybGQK');
      }
    });

## License

MIT

