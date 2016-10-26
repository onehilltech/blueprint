const request = require ('supertest')
  , blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  , async     = require ('async')
  , expect    = require ('chai').expect
  , _         = require ('underscore')
  , ConnectionManager = require ('../../../lib/ConnectionManager')
  ;

const appPath = path.resolve (__dirname, '../../fixtures/app');

describe ('ResourceController', function () {
  var server = null;

  before (function (done) {
    async.waterfall ([
      function (callback) {
        blueprint.testing.createApplicationAndStart (appPath, callback);
      },

      function (app, callback) {
        // Make sure the default connection is open.
        server = app.server;
        return callback (null);
      }
    ], done);
  });

  describe ('create', function () {
    it ('should create a resource', function (done) {
      var dob  = new Date ().toISOString();
      var data = {
        person: {
          first_name: 'John', last_name: 'Doe', age: 21, sex: 'Male', dob: dob,
          address: {
            street: 'Make Believe Lane',
            city: 'Magic',
            state: 'TN',
            zipcode: 12345
          }
        }
      };

      request (server.app)
        .post ('/person')
        .send (data)
        .expect (200)
        .end (function (err, req) {
          if (err) return done (err);

          data.person._id = req.body.person._id;
          data.person.books = [];

          expect (req.body).to.deep.equal (data);

          return done (null);
        }, done);
    });

    it ('should not create resource; missing parameters', function (done) {
      request (server.app)
        .post ('/person')
        .send ({person: {sex: 'Ok'}})
        .expect (400, [
          { param: "person.age", msg: "Invalid/missing Int"},
          { param: "person.sex", msg: "Expected [ 'Female', 'Male' ]", value: 'Ok'},
          { param: "person.dob", msg: "Invalid date format"},
          { param: 'person.address.street', msg: 'Invalid param' },
          { param: 'person.address.city', msg: 'Invalid param' },
          { param: 'person.address.state', msg: 'Invalid param' }
        ], done);
    });
  });
});
