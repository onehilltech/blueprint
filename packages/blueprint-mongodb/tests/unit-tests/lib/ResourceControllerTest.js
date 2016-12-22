const request = require ('supertest')
  , blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  , async     = require ('async')
  , util      = require ('util')
  , expect    = require ('chai').expect
  , _         = require ('underscore')
  , lib       = require ('../../../lib')
  , testing   = lib.testing
  , ConnectionManager = require ('../../../lib/ConnectionManager')
  ;

const datamodel = require (path.resolve (__dirname, '../../fixtures/datamodel'));

describe ('lib.ResourceController', function () {
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

  describe ('/person', function () {
    describe ('POST', function () {
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
            education: datamodel.models.degrees[0].id,
            degrees: [
              datamodel.models.degrees[0].id,
              datamodel.models.degrees[1].id
            ]
          }
        };

        request (server.app)
          .post ('/person')
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            expect (res.headers).to.have.property ('last-modified');

            person = res.body.person;
            data.person._id = person._id;

            expect (res.body.person).to.deep.equal (data.person);

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

    describe ('GET', function () {
      it ('should return a list of persons', function (done) {
        var expected = {
          people: [
            _.omit (testing.lean (datamodel.models.persons[0]), ['__v']),
            person
          ],

          degrees: [
            _.extend (datamodel.data.degrees[0], {_id: datamodel.models.degrees[0].id}),
            _.extend (datamodel.data.degrees[1], {_id: datamodel.models.degrees[1].id})
          ]
        };

        request (server.app)
          .get ('/person')
          .query ({options: {populate: true}})
          .expect (200, expected)
          .end (function (err, res) {
            if (err) return done (err);

            expect (res.headers).to.have.property ('last-modified');

            return done (null);
          });
      });
    });

    describe ('If-Modified-Since', function () {
      it ('should return all the resources [date in the past]', function (done) {
        var expected = {
          people: [
            _.omit (testing.lean (datamodel.models.persons[0]), ['__v']),
            person
          ],

          degrees: [
            _.extend (datamodel.data.degrees[0], {_id: datamodel.models.degrees[0].id}),
            _.extend (datamodel.data.degrees[1], {_id: datamodel.models.degrees[1].id})
          ]
        };

        // set date to 3 days ago.
        var date = Date.now () - (3 * 24 * 60 * 60 * 1000);

        request (server.app)
          .get ('/person')
          .query ({options: {populate: true}})
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (200, expected, done);
      });

      it ('should return not changed [date in the future]', function (done) {
        // set date to 5 days from now.
        var date = Date.now () + (5 * 24 * 60 * 60 * 1000);

        request (server.app)
          .get ('/person')
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (304, done);
      });
    });

  });

  describe ('/person/count', function () {
    describe ('GET', function () {
      it ('should count the number of resources', function (done) {
        request (server.app)
          .get ('/person/count')
          .expect (200, {count: 2}, done);
      });
    });
  });

  describe ('/person/:personId', function () {
    var updated;

    describe ('GET', function () {
      it ('should return a single person', function (done) {
        request (server.app)
          .get ('/person/' + person._id)
          .expect (200, done);
      });

      it ('should return a single person with a populated data', function (done) {
        request (server.app)
          .get ('/person/' + person._id)
          .query ({populate: true})
          .expect (200, {
            degrees: [
              _.extend (datamodel.data.degrees[0], {_id: datamodel.models.degrees[0].id}),
              _.extend (datamodel.data.degrees[1], {_id: datamodel.models.degrees[1].id})
            ],
            person: person
          }, done);
      });

      it ('should not find the resource', function (done) {
        request (server.app)
          .get ('/person/' + new lib.Types.ObjectId ().toString ())
          .query ({populate: true})
          .expect (404, done);
      });
    });

    describe ('PUT', function () {
      it ('should update a resource', function (done) {
        var data = {
          person: { first_name: 'James', last_name: 'Hill' }
        };

        request (server.app)
          .put ('/person/' + person._id)
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            person.first_name = 'James';
            person.last_name = 'Hill';

            updated = res.body.person;

            // Check the _stat fields.
            expect (res.body.person).to.deep.equal (person);
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

            var omits = ['_stat'];
            expect (_.omit (res.body.person, omits)).to.deep.equal (_.omit (person, omits));

            updated = res.body.person;

            return done (null);
          });
      });
    });

    describe ('If-Modified-Since', function () {
      it ('should return resource since it has been modified since date', function (done) {
        // set date to 3 days ago.
        var date = Date.now () - (3 * 24 * 60 * 60 * 1000);

        request (server.app)
          .get ('/person/' + person._id)
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (200, {person: updated}, done);
      });

      it ('should not return resource since it has not been modified since date', function (done) {
        // set date to 5 days from now.
        var date = Date.now () + (5 * 24 * 60 * 60 * 1000);

        request (server.app)
          .get ('/person/' + person._id)
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (304, done);
      });
    });

    describe ('HEAD', function () {
      it ('should return the header for the single resource', function (done) {
        request (server.app)
          .head ('/person')
          .expect (200).end (function (err, res) {
            return done (err);
        });
      });
    });

    describe ('DELETE', function () {
      it ('should delete a single person from the database', function (done) {
        request (server.app)
          .delete ('/person/' + person._id)
          .expect (200, 'true', done);
      });

      it ('should not delete a already deleted resource', function (done) {
        request (server.app)
          .delete ('/person/' + person._id)
          .expect (404, done);
      });
    });
  });
});
