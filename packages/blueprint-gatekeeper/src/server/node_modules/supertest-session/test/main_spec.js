var tr = require('through'),
    assert = require('assert'),
    app = require('./app'),
    session = require('../index');

describe('supertest session', function () {

  var sess = null;

  var Session = session({
    app: app,
    envs: { NODE_ENV: 'development'}
  });

  beforeEach(function (done) {
    sess = new Session();
    sess.request('get', '/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    sess.request('get', '/')
      .expect(200)
      .expect('GET,,2')
      .end(done);
  });

  it('should set enviromental variables', function(done) {
    sess.request('get', '/env')
      .expect(200)
      .end(function(err, res) {
        assert.equal(err, undefined);
        assert.equal(JSON.parse(res.text).NODE_ENV, 'development');
        done();
      });
  });

  it('should destroy session', function (done) {
    sess.destroy();
    sess.get('/')
      .expect(200)
      .expect('GET,,1')
      .end(done);
  });

  describe('method sugar', function () {
    var methods = {
      'del'   : 'DELETE',
      'get'   : 'GET',
      'post'  : 'POST',
      'put'   : 'PUT',
      'patch' : 'PATCH'
    };

    Object.keys(methods).forEach(function (key) {
      it('should support ' + key, function (done) {
        sess[key]('/')
          .expect(200)
          .expect(methods[key] + ',,2')
          .end(done);
      });
    });
  });
});

describe('Session with a .before hook', function () {

  var sess = null;

  var Session = session({
    app: app,
    before: function (req) {
      req.set('authorization', 'bearer TEST_SESSION_TOKEN');
    }
  });

  beforeEach(function (done) {
    sess = new Session();
    sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    sess.request('get', '/token')
      .expect(200)
      .expect('GET,token,2')
      .end(done);
  });
});

