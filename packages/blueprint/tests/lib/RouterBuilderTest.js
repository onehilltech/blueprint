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
  ;

describe ('RouterBuilder', function () {
  var routerBuilder;
  var routersPath;
  var app;

  before (function (done) {
    appFixture (function (err, a) {
      if (err) return done (err);

      app = a;
      app.models.Person.remove ({}, done);
    });
  });

  after (function (done) {
    app.database.disconnect (done);
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
    var id;

    describe ('all', function () {
      var data = {person: {first_name: 'James', last_name: 'Hill'}};

      it ('should create a new resource', function (done) {
        request (app.server.app)
          .post ('/persons')
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            data.person._id = res.body.person._id;
            expect (res.body).to.deep.equal (data);

            id = res.body.person._id;

            return done ();
          });
      });

      it ('should not create the resource [missing body]', function (done) {
        request (app.server.app)
          .post ('/persons')
          .expect (400, done);
      });

      it ('should not create the resource [invalid parameters]', function (done) {
        request (app.server.app)
          .post ('/persons')
          .send ({first: 'James', last: 'Hill'})
          .expect (400, done);
      });

      it ('should retrieve a single resource', function (done) {
        request (app.server.app)
          .get ('/persons/' + id)
          .expect (200, { person: {_id: id, first_name: 'James', last_name: 'Hill'}}, done);
      });

      it ('should retrieve a list of all resources', function (done) {
        request (app.server.app)
          .get ('/persons')
          .expect (200, { persons: [{ _id: id, first_name: 'James', last_name: 'Hill'}]}, done);
      });

      it ('should update a single resource', function (done) {
        async.series ([
          function (callback) {
            request (app.server.app)
              .put ('/persons/' + id)
              .send ({person: {first_name: 'Lanita', last_name: 'Hill'}})
              .expect (200, {person: {_id: id, first_name: 'Lanita', last_name: 'Hill'}}, callback);
          },

          function (callback) {
            request (app.server.app)
              .get ('/persons/' + id)
              .expect (200, {person: {_id: id, first_name: 'Lanita', last_name: 'Hill'}}, callback);
          }

        ], done);
      });

      it ('should delete an existing resource', function (done) {
        request (app.server.app)
          .delete ('/persons/' + id)
          .expect (200, 'true', done);
      });

      it ('should not delete an existing resource', function (done) {
        request (app.server.app)
          .delete ('/persons/' + id)
          .expect (404, done);
      });
    });

    // allowed routing...
    describe ('whitelist', function () {

      // allow: create, getOne

      it ('should create a new resource', function (done) {
        request (app.server.app)
          .post ('/allow')
          .send ({person: {first_name: 'James', last_name: 'Hill'}})
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            id = res.body.person._id;

            return done ();
          });
      });

      it ('should get a single resource', function (done) {
        request (app.server.app)
          .get ('/allow/' + id)
          .expect (200, done);
      });

      it ('should not retrieve all the resources', function (done) {
        request (app.server.app)
          .get ('/allow')
          .expect (404, done);
      });
    });

    describe ('blacklist', function () {

      // deny: delete

      it ('should create a new resource', function (done) {
        request (app.server.app)
          .post ('/deny')
          .send ({person: {first_name: 'James', last_name: 'Hill'}})
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            id = res.body.person._id;

            return done ();
          });
      });

      it ('should get a single resource', function (done) {
        request (app.server.app)
          .get ('/deny/' + id)
          .expect (200, done);
      });

      it ('should not delete the resource', function (done) {
        request (app.server.app)
          .delete ('/deny')
          .expect (404, done);
      });
    });
  });
});