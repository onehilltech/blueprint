var path    = require ('path')
  , expect  = require ('chai').expect
  , async   = require ('async')
  , request = require ('supertest')
  , util    = require ('util')
  , winston = require ('winston')
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  , appFixture        = require ('../fixtures/app')
  , blueprint         = require ('../fixtures/lib')
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
      routerBuilder = new RouterBuilder (app.controllers);

      expect (routerBuilder._controllers).to.equal (app.controllers);
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

  describe ('resources', function () {
    describe ('all actions', function () {
      describe ('create', function () {
        it ('should invoke the create method', function (done) {
          request (app.server.app)
            .post ('/echo')
            .expect (200, {message: 'create'}, done);
        });
      });

      describe ('get', function () {
        it ('should invoke the get method', function (done) {
          var id = 7;

          request (app.server.app)
            .get ('/echo/' + id)
            .expect (200, {message: 'get', id: id}, done);
        });

        it ('should invoke the getAll method', function (done) {
          request (app.server.app)
            .get ('/echo')
            .expect (200, {message: 'getAll'}, done);
        })
      });

      describe ('update', function () {
        it ('should invoke the update method', function (done) {
          var id = 19;

          request (app.server.app)
            .put ('/echo/' + id)
            .expect (200, {message: 'update', id: id}, done);
        });
      });

      describe ('delete', function () {
        it ('should invoke the delete method', function (done) {
          var id = 37;

          request (app.server.app)
            .delete ('/echo/' + id)
            .expect (200, {message: 'delete', id: id}, done);
        });
      });

      describe ('outdated', function () {
        it ('should invoke the outdated method', function (done) {
          request (app.server.app)
            .get ('/echo/outdated')
            .expect (200, {message: 'allOutdated'}, done);
        });

        it ('should invoke the isAllOutdated method', function (done) {
          var id = 25;

          request (app.server.app)
            .get ('/echo/' + id + '/outdated')
            .expect (200, {message: 'outdated', id: id}, done);
        });
      });

      describe ('count', function () {
        it ('should invoke the count method', function (done) {
          request (app.server.app)
            .get ('/echo/count')
            .expect (200, {message: 'count'}, done);
        });
      });

    });

    describe ('whitelist', function () {
      // allow: create, getOne

      it ('should invoke the create method', function (done) {
        request (app.server.app)
          .post ('/allow')
          .expect (200, {message: 'create'}, done);
      });

      it ('should invoke the get method', function (done) {
        var id = 7;

        request (app.server.app)
          .get ('/allow/' + id)
          .expect (200, {message: 'get', id: id}, done);
      });

      it ('should not invoke the getAll method', function (done) {
        request (app.server.app)
          .get ('/allow')
          .expect (404, done);
      });

      it ('should not invoke the update method', function (done) {
        request (app.server.app)
          .put ('/allow/7')
          .expect (404, done);
      });

      it ('should not invoke the delete method', function (done) {
        request (app.server.app)
          .delete ('/allow/7')
          .expect (404, done);
      });
    });

    describe ('blacklist', function () {
      // deny: delete

      it ('should invoke the create method', function (done) {
        request (app.server.app)
          .post ('/allow')
          .expect (200, {message: 'create'}, done);
      });

      it ('should not invoke the delete method', function (done) {
        request (app.server.app)
          .delete ('/allow/7')
          .expect (404, done);
      });
    });
  });
});