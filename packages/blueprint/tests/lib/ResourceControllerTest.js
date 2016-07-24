var expect  = require ('chai').expect
  , async   = require ('async')
  , request = require ('supertest')
  ;

var blueprint = require ('../fixtures/blueprint')
  , datamodel = require ('../fixtures/datamodel')
  ;

var ResourceController = require ('../../lib/ResourceController')
  , HttpError = require ('../../lib/errors/HttpError')
  ;

describe ('ResourceController', function () {
  var server;

  function passthrough (result, req, callback) {
    return callback (null, result);
  }

  before (function (done) {
    server = blueprint.app.server;

    async.series ([
      function (callback) { datamodel.apply (callback); }
    ], done);
  });

  describe ('#check', function () {
    it ('should create a new check function', function () {
      var f = ResourceController.check (passthrough, true);

      expect (f).to.be.a.function;
    });

    it ('should evaluate to true', function (done) {
      var f = ResourceController.check (passthrough, true);

      f (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });
  });

  describe ('#runChecks', function () {
    it ('should pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.check (passthrough, true),
        ResourceController.check (passthrough, true)
      ], null, function (result) {
        expect (result).to.be.undefined;
      });
    });

    it ('should should fail one of the checks', function () {
      ResourceController.runChecks ([
        ResourceController.check (passthrough, true),
        ResourceController.check (passthrough, false)
      ], null, function (result) {
        expect (result).to.deep.equal ({ message: 'Unauthorized access', name: 'HttpError', statusCode: 403 });
      });
    });
  });

  describe ('#orCheck', function () {
    it ('should pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.orCheck ([
          ResourceController.check (passthrough, true),
          ResourceController.check (passthrough, true)]
        )
      ], null, function (result) {
        expect (result).to.be.undefined;
      });
    });

    it ('should not pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.orCheck ([
          ResourceController.check (passthrough, false),
          ResourceController.check (passthrough, false)]
        )
      ], null, function (result) {
        expect (result).to.deep.equal ({ message: 'Unauthorized access', name: 'HttpError', statusCode: 403 });
      });
    });
  });

  describe ('#andCheck', function () {
    it ('should pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.andCheck ([
          ResourceController.check (passthrough, true),
          ResourceController.check (passthrough, true)]
        )
      ], null, function (result) {
        expect (result).to.be.undefined;
      });
    });

    it ('should pass all checks, includes nested', function () {
      ResourceController.runChecks ([
        ResourceController.check (passthrough, true),
        ResourceController.check (passthrough, true),
        ResourceController.andCheck ([
          ResourceController.check (passthrough, true),
          ResourceController.check (passthrough, true),
        ])
      ], null, function (result) {
        expect (result).to.be.undefined;
      });
    });

    it ('should not pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.andCheck ([
          ResourceController.check (passthrough, true),
          ResourceController.check (passthrough, false)]
        )
      ], null, function (result) {
        expect (result).to.deep.equal ({ message: 'Unauthorized access', name: 'HttpError', statusCode: 403 });
      });
    });
  });

  describe ('GET /persons', function () {
    it ('should get all persons in the database', function (done) {
      request (server.app)
        .get ('/persons')
        .expect (200).end (function (err, res) {
          if (err) return done (err);

          expect (res.body.persons).to.have.length (4);
          return done ();
      });
    });

    it ('should get middle 2 person from database, ordered by name', function (done) {
      request (server.app)
        .get ('/persons?options={"sort":{"last_name":1},"skip":1,"limit":2}')
        .expect (200).end (function (err, res) {
        if (err) return done (err);

        expect (res.body).to.deep.equal ({persons: [
          datamodel.data.persons[0],
          datamodel.data.persons[2]
        ]});
        return done ();
      });
    });
  })
});