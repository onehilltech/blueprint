'use strict';

const mongodb   = require ('../../../../lib')
  , expect      = require ('chai').expect
  , ConstPlugin = require ('../../../../lib/plugins/ConstPlugin')
  , async       = require ('async')
  ;

describe ('lib.plugins.ConstPlugin', function () {
  let Person;

  it ('should create a schema with the const fields', function () {
    let schema = new mongodb.Schema ({
      first_name: String,
      last_name: String,

      // This field should be const after initial creation.
      creator: {type: String, required: true, const: true}
    });

    schema.plugin (ConstPlugin);

    Person = mongodb.model ('person', schema, 'blueprint_persons');
    expect (Person.const ()).to.eql (['creator']);
  });

  describe ('save', function () {
    it ('should not update a const field', function (done) {
      async.waterfall ([
        function (callback) {
          let person = new Person ({first_name: 'James', last_name: 'Hill', creator: 'me'});
          person.save (callback);
        },

        function (person, n, callback) {
          // Try and update the creator. We should not see a change in value.
          person.creator = 'you';
          expect (person.creator).to.equal ('me');

          person.save (callback);
        },

        function (person, n, callback) {
          // The value should still be the same after a save.
          expect (person.creator).to.equal ('me');

          // Make sure we can pull the original value out of the database.
          Person.findById (person.id, callback);
        },

        function (person, callback) {
          expect (person.creator).to.equal ('me');
          return callback (null);
        }
      ], done);
    });
  });

  describe ('findOneAndUpdate', function () {
    it ('should not update a const field', function (done) {
      async.waterfall ([
        function (callback) {
          let person = new Person ({first_name: 'John', last_name: 'Doe', creator: 'me'});
          person.save (callback);
        },

        function (person, n, callback) {
          Person.findOneAndUpdate ({_id: person._id}, {creator: 'you'}, {new: true}, callback);
        },

        function (person, callback) {
          // The value should still be the same after a save.
          expect (person.creator).to.equal ('me');

          // Make sure we can pull the original value out of the database.
          Person.findById (person.id, callback);
        },

        function (person, callback) {
          expect (person.creator).to.equal ('me');
          return callback (null);
        }
      ], done);
    });
  });

  describe ('update', function () {
    it ('should not update a const field', function (done) {
      let person;

      async.waterfall ([
        function (callback) {
          person = new Person ({first_name: 'Jack', last_name: 'Black', creator: 'me'});
          person.save (callback);
        },

        function (person, n, callback) {
          Person.update ({id: person.id}, {creator: 'you'}, callback);
        },

        function (n, callback) {
          // Make sure we can pull the original value out of the database.
          Person.findById (person.id, callback);
        },

        function (person, callback) {
          expect (person.creator).to.equal ('me');
          return callback (null);
        }
      ], done);
    });
  });
});