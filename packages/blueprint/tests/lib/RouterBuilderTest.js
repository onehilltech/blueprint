var path    = require ('path')
  , expect  = require ('chai').expect
  , async   = require ('async')
  , request = require ('supertest')
  , util    = require ('util')
  , winston = require ('winston')
  , testing = require ('../../lib/testing')
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  , appFixture        = require ('../fixtures/app')
  ;

describe ('RouterBuilder', function () {
  var routerBuilder;
  var routersPath;
  var app;

  before (function (done) {
    appFixture (function (err, a) {
      if (err) return done (err);
      app = a;

      return done (null);
    });
  });

  describe ('new RouterBuilder ()', function () {
    it ('should create a new RouterBuilder', function () {
      routersPath = path.resolve (__dirname, '../fixtures/app/routers');
      routerBuilder = new RouterBuilder (app);

      expect (routerBuilder._app).to.equal (app);
    });
  });
  
  describe ('#addRoutes', function () {
    it ('should add routes to the router', function () {
      var spec = require (path.join (routersPath, 'TestRouter'));

      routerBuilder.addSpecification (spec);
      var router = routerBuilder.getRouter ();

      expect (router.params).to.have.keys (['param1']);
      expect (router.params.param1).to.have.length (1);
      expect (router.params.param1[0]).to.be.a.function;

      expect (router.stack[0].route.path).to.equal ('/helloworld');
      expect (router.stack[1].route.path).to.equal ('/helloworld/inner');
    });
  });

  describe ('policies', function () {
    it ('should handle request because policy passed', function (done) {
      testing.request ()
        .get ('/policies/accepted')
        .expect (200, 'Hello, World!', done);
    });

    it ('should reject request because policy failed', function (done) {
      testing.request ()
        .get ('/policies/rejected')
        .expect (403, { errors: { code: 'policy_failed', message: 'Policy failed'}}, done);
    });

    it ('should reject request because policy failed on a http method', function (done) {
      testing.request ()
        .get ('/policies/methods/rejected')
        .expect (403, { errors: { code: 'policy_failed', message: 'Policy failed'} }, done);
    });
  });

  describe ('resources', function () {
    describe ('all actions', function () {
      describe ('create', function () {
        it ('should invoke the create method', function (done) {
          testing.request ()
            .post ('/echo')
            .expect (200, {message: 'create'}, done);
        });
      });

      describe ('get', function () {
        it ('should invoke the get method', function (done) {
          var id = 7;

          testing.request ()
            .get ('/echo/' + id)
            .expect (200, {message: 'get', id: id}, done);
        });

        it ('should invoke the getAll method', function (done) {
          testing.request ()
            .get ('/echo')
            .expect (200, {message: 'getAll'}, done);
        })
      });

      describe ('update', function () {
        it ('should invoke the update method', function (done) {
          var id = 19;

          testing.request ()
            .put ('/echo/' + id)
            .expect (200, {message: 'update', id: id}, done);
        });
      });

      describe ('delete', function () {
        it ('should invoke the delete method', function (done) {
          var id = 37;

          testing.request ()
            .delete ('/echo/' + id)
            .expect (200, {message: 'delete', id: id}, done);
        });
      });

      describe ('count', function () {
        it ('should invoke the count method', function (done) {
          testing.request ()
            .get ('/echo/count')
            .expect (200, {message: 'count'}, done);
        });
      });

      describe ('header', function () {
        it ('should invoke the header method', function (done) {
          testing.request ()
            .head ('/echo')
            .expect ('Method-Call', 'header')
            .expect (200, done);
        });
      });
    });

    describe ('whitelist', function () {
      // allow: create, getOne

      it ('should invoke the create method', function (done) {
        testing.request ()
          .post ('/allow')
          .expect (200, {message: 'create'}, done);
      });

      it ('should invoke the get method', function (done) {
        var id = 7;

        testing.request ()
          .get ('/allow/' + id)
          .expect (200, {message: 'get', id: id}, done);
      });

      it ('should not invoke the getAll method', function (done) {
        testing.request ()
          .get ('/allow')
          .expect (404, done);
      });

      it ('should not invoke the update method', function (done) {
        testing.request ()
          .put ('/allow/7')
          .expect (404, done);
      });

      it ('should not invoke the delete method', function (done) {
        testing.request ()
          .delete ('/allow/7')
          .expect (404, done);
      });
    });

    describe ('blacklist', function () {
      // deny: delete

      it ('should invoke the create method', function (done) {
        testing.request ()
          .post ('/allow')
          .expect (200, {message: 'create'}, done);
      });

      it ('should not invoke the delete method', function (done) {
        testing.request ()
          .delete ('/allow/7')
          .expect (404, done);
      });
    });

    describe ('policies', function () {
      it ('should accept request on all methods', function (done) {
        testing.request ()
          .get ('/resource/policies/accepted')
          .expect (200, done);
      });

      it ('should reject request on all methods', function (done) {
        testing.request ()
          .get ('/resource/policies/rejected')
          .expect (403, done);
      });

      it ('should accept request on a single resource action', function (done) {
        testing.request ()
          .get ('/resource/policies/methods/id')
          .expect (200, done);
      });

      it ('should reject request on a single resource action', function (done) {
        testing.request ()
          .get ('/resource/policies/methods')
          .expect (403, done);
      })
    });
  });
});