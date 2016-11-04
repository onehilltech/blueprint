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
  var personId;

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
          }
        }
      };

      request (server.app)
        .post ('/person')
        .send (data)
        .expect (200)
        .end (function (err, req) {
          if (err) return done (err);

          personId = data.person._id = req.body.person._id;
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
        .get ('/person/' + personId)
        .expect (200, done);
    });

    it ('should return a single person with a populated data', function (done) {
      request (server.app)
        .get ('/person/' + datamodel.models.persons[0].id + '?populate=true')
        .expect (200, function (err, res) {
          return done (err);
        });
    });
  });
});
