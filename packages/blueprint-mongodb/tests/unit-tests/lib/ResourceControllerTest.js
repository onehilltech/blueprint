const request = require ('supertest')
  , blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  , async     = require ('async')
  , expect    = require ('chai').expect
  , _         = require ('underscore')
  , ConnectionManager = require ('../../../lib/ConnectionManager')
  ;

const datamodel = require (path.resolve (__dirname, '../../fixtures/datamodel'));

describe ('ResourceController', function () {
  var server = null;
  var person;

  before (function (done) {
    async.waterfall ([
      function (callback) {
        datamodel.apply (callback);
      },
      function (result, callback) {
        // Make sure the default connection is open.
        server = result[0].server;
        return callback (null);
      }
    ], done);
  });

  describe ('create', function () {
    it ('should create a resource', function (done) {
      var dob  = new Date ().toISOString();
      var data = {
        person: {
          first_name: 'John', last_name: 'Doe', age: 21, gender: 'Male', dob: dob,
          address: {
            street: 'Make Believe Lane',
            city: 'Magic',
            state: 'TN',
            zipcode: '12345'
          },
          education: datamodel.models.degrees[0].id
        }
      };

      request (server.app)
        .post ('/person')
        .send (data)
        .expect (200)
        .end (function (err, req) {
          if (err) return done (err);

          person = req.body.person;
          data.person._id = person._id;
          expect (req.body).to.deep.equal (data);

          return done (null);
        }, done);
    });

    it ('should not create resource; missing parameters', function (done) {
      request (server.app)
        .post ('/person')
        .send ({person: {gender: 'Ok'}})
        .expect (400, [
          { param: "person.age", msg: "Invalid/missing Int"},
          { param: "person.gender", msg: "Expected [ 'Female', 'Male' ]", value: 'Ok'},
          { param: "person.dob", msg: "Invalid date format"},
          { param: 'person.address.street', msg: 'Invalid param' },
          { param: 'person.address.city', msg: 'Invalid param' },
          { param: 'person.address.state', msg: 'Invalid param' },
          { param: 'person.address.zipcode', msg: 'Invalid param' }
        ], done);
    });
  });

  describe ('get', function () {
    it ('should return a single person', function (done) {
      request (server.app)
        .get ('/person/' + person._id)
        .expect (200, done);
    });

    it ('should return a single person with a populated data', function (done) {
      request (server.app)
        .get ('/person/' + person._id + '?populate=true')
        .expect (200, {
          degrees: [_.extend (datamodel.data.degrees[0], {_id: datamodel.models.degrees[0].id})],
          person: person
        }, done);
    });
  });

  describe ('update', function () {
    it ('should update a resource', function (done) {
      var data = {
        person: { first_name: 'James', last_name: 'Hill' }
      };

      request (server.app)
        .put ('/person/' + person._id)
        .send (data)
        .expect (200)
        .end (function (err, req) {
          if (err) return done (err);

          person.first_name = 'James';
          person.last_name = 'Hill';

          expect (req.body).to.deep.equal ({person: person});
          return done (null);
        });
    });

    it ('should update resource, excluding unknown param', function (done) {
      var data = {
        person: { firstname: 'Jake', last_name: 'Williams'}
      };

      request (server.app)
        .put ('/person/' + person._id)
        .send (data)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          person.last_name = 'Williams';

          expect (res.body).to.deep.equal ({person: person});
          return done (null);
        });
    });
  });

  describe ('count', function () {
    it ('should count the number of resources', function (done) {
      request (server.app)
        .get ('/person/count')
        .expect (200, {count: 2}, done);
    });
  });
});
