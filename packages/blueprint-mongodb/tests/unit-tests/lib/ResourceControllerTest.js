'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , path    = require ('path')
  , async   = require ('async')
  , util    = require ('util')
  , expect  = require ('chai').expect
  , _       = require ('underscore')
  , lib     = require ('../../../lib')
  , testing = lib.testing
  ;

describe ('lib.ResourceController', function () {
  var person;

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
            education: blueprint.app.seeds.$default.degrees[0].id,
            degrees: [
              blueprint.app.seeds.$default.degrees[0].id,
              blueprint.app.seeds.$default.degrees[1].id
            ]
          }
        };

        blueprint.testing.request ()
          .post ('/person')
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            expect (res.headers).to.have.property ('last-modified');

            person = res.body.person;
            data.person._id = person._id;
            data.person.applications = [];

            expect (res.body.person).to.deep.equal (data.person);

            return done (null);
          }, done);
      });

      it ('should not create resource; missing parameters', function (done) {
        blueprint.testing.request ()
          .post ('/person')
          .send ({person: {gender: 'Ok'}})
          .expect (400, {
            errors: {
              code: 'validation_failed',
              message: 'Request validation failed',
              details: {
                validation: {
                  'person.address.city': { location: 'params', param: 'person.address.city', msg: 'Invalid value' },
                  'person.address.state': { location: 'params', param: 'person.address.state', msg: 'Invalid value' },
                  'person.address.street': { location: 'params', param: 'person.address.street', msg: 'Invalid value' },
                  'person.address.zipcode': { location: 'params', param: 'person.address.zipcode', msg: 'Invalid value' },
                  'person.age': { location: 'params', param: 'person.age', msg: 'Invalid value'},
                  'person.gender': { location: 'body', param: "person.gender", msg: "Expected [ 'Female', 'Male' ]", value: 'Ok'},
                  'person.dob': { location: 'params', param: "person.dob", msg: 'Invalid value'}
                }
              }
            }
          }, done);
      });
    });

    describe ('GET', function () {
      it ('should return a list of persons', function (done) {
        var expected = {
          people: [
            blueprint.app.seeds.$default.persons[0].lean (),
            person
          ],

          degrees: [
            blueprint.app.seeds.$default.degrees[0].lean (),
            blueprint.app.seeds.$default.degrees[1].lean ()
          ],

          schools: [
            blueprint.app.seeds.$default.schools[0].lean (),
            blueprint.app.seeds.$default.schools[1].lean ()
          ]
        };

        blueprint.testing.request ()
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
            blueprint.app.seeds.$default.persons[0].lean (),
            person
          ],

          degrees: [
            blueprint.app.seeds.$default.degrees[0].lean (),
            blueprint.app.seeds.$default.degrees[1].lean ()
          ],

          schools: [
            blueprint.app.seeds.$default.schools[0].lean (),
            blueprint.app.seeds.$default.schools[1].lean ()
          ]
        };

        // set date to 3 days ago.
        var date = Date.now () - (3 * 24 * 60 * 60 * 1000);

        blueprint.testing.request ()
          .get ('/person')
          .query ({options: {populate: true}})
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (200, expected, done);
      });

      it ('should return not changed [date in the future]', function (done) {
        // set date to 5 days from now.
        var date = Date.now () + (5 * 24 * 60 * 60 * 1000);

        blueprint.testing.request ()
          .get ('/person')
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (304, done);
      });
    });

  });

  describe ('/person/count', function () {
    describe ('GET', function () {
      it ('should count the number of resources', function (done) {
        blueprint.testing.request ()
          .get ('/person/count')
          .expect (200, {count: 2}, done);
      });
    });
  });

  describe ('/person/:personId', function () {
    var updated;

    describe ('GET', function () {
      it ('should return a single person', function (done) {
        blueprint.testing.request ()
          .get ('/person/' + person._id)
          .expect (200, done);
      });

      it ('should return a single person with a populated data', function (done) {
        const person = blueprint.app.seeds.$default.persons[0];

        blueprint.testing.request ()
          .get ('/person/' + person._id)
          .query ({populate: true})
          .expect (200, {
            degrees: [
              blueprint.app.seeds.$default.degrees[0].lean ()
            ],
            people: [],
            person: person.lean (),
            schools: [
              blueprint.app.seeds.$default.schools[0].lean (),
              blueprint.app.seeds.$default.schools[1].lean ()
            ]
          }, done);
      });

      it ('should not find the resource', function (done) {
        blueprint.testing.request ()
          .get ('/person/' + new lib.Types.ObjectId ().toString ())
          .query ({populate: true})
          .expect (404, done);
      });

      it ('should return a bad request', function (done) {
        blueprint.testing.request ()
          .get ('/person/me')
          .expect (400, {
            errors: {
              code: "validation_failed",
              message: "Request validation failed",
              details: {
                validation: {
                  personId: {
                    location: "params",
                    msg: "Invalid resource id",
                    param: "personId",
                    value: "me"
                  }
                }
              }
            }
          }, done);
      });
    });

    describe ('PUT', function () {
      it ('should update a resource', function (done) {
        var data = {
          person: { first_name: 'James', last_name: 'Hill' }
        };

        blueprint.testing.request ()
          .put ('/person/' + person._id)
          .send (data)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            person.first_name = data.person.first_name;
            person.last_name = data.person.last_name;

            updated = res.body.person;

            // Check the _stat fields.
            expect (res.body.person).to.deep.equal (person);
            return done (null);
          });
      });

      it ('should update resource, excluding unknown param', function (done) {
        var data = {
          person: { fname: 'Jake', middle_name: 'M', last_name: 'Williams'}
        };

        blueprint.testing.request ()
          .put ('/person/' + person._id)
          .send (data).expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            person.last_name = 'Williams';
            person.middle_name = 'M';

            expect (res.body.person).to.deep.equal (person);

            updated = res.body.person;

            return done (null);
          });
      });

      it ('should delete a field in the resource', function (done) {
        var data = {
          person: { middle_name: null}
        };

        blueprint.testing.request ()
          .put ('/person/' + person._id)
          .send (data).expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            updated = res.body.person;
            expect (updated).to.deep.equal (_.omit (person, ['middle_name']));

            return done (null);
          });
      });
    });

    describe ('If-Modified-Since', function () {
      it ('should return resource since it has been modified since date', function (done) {
        // set date to 3 days ago.
        var date = Date.now () - (3 * 24 * 60 * 60 * 1000);

        blueprint.testing.request ()
          .get ('/person/' + person._id)
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (200, {person: updated}, done);
      });

      it ('should not return resource since it has not been modified since date', function (done) {
        // set date to 5 days from now.
        var date = Date.now () + (5 * 24 * 60 * 60 * 1000);

        blueprint.testing.request ()
          .get ('/person/' + person._id)
          .set ('If-Modified-Since', new Date (date).toUTCString ())
          .expect (304, done);
      });
    });

    describe ('HEAD', function () {
      it ('should return the header for the single resource', function (done) {
        blueprint.testing.request ()
          .head ('/person')
          .expect (200).end (function (err, res) {
            return done (err);
        });
      });
    });

    describe ('DELETE', function () {
      it ('should delete a single person from the database', function (done) {
        blueprint.testing.request ()
          .delete ('/person/' + person._id)
          .expect (200, 'true', done);
      });

      it ('should not delete a already deleted resource', function (done) {
        blueprint.testing.request ()
          .delete ('/person/' + person._id)
          .expect (404, done);
      });
    });
  });
});
