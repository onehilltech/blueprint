var _ = require('lodash'),
    app = require('./app'),
    Session = require('../index')({ app: app });

describe('supertest session', function () {
  before(function (done) {
    this.sess = new Session();

    this.sess.request('get', '/')
      .expect(200)
      .expect('GET,1')
      .end(done);
  });

  it('should increment session counter', function (done) {
    this.sess.request('get', '/')
      .expect(200)
      .expect('GET,2')
      .end(done);
  });

  it('should destroy session', function (done) {
    this.sess.destroy();
    this.sess.get('/')
      .expect(200)
      .expect('GET,1')
      .end(done);
  });

  describe('method sugar', function () {
    var count = 1,
        methods = {
          'del': 'DELETE',
          'get': 'GET',
          'post': 'POST',
          'put': 'PUT'
        };

    _.each(methods, function (v, m) {
      it('should support ' + m, function (done) {
        this.sess[m]('/')
          .expect(200)
          .expect([v, ++count].join(','))
          .end(done);
      });
    });
  });
});

