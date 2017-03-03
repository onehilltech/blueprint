'use strict';

const mongodb   = require ('../../../../lib')
  , expect      = require ('chai').expect
  , ConstPlugin = require ('../../../../lib/plugins/ConstPlugin')
  , datamodel   = require ('../../../fixtures/datamodel')
  , async       = require ('async')
  ;

describe ('lib.plugins.ConstPlugin', function () {
  var Person;

  before (function (done) {
    datamodel.apply (function (err) {
      return done (err);
    });
  });

  it ('should create a schema with the const fields', function () {
    var schema = new mongodb.Schema ({
      first_name: String,
      last_name: String,

      // This field should be const after initial creation.
      creator: {type: String, required: true, const: true}
    });

    schema.plugin (ConstPlugin);
    expect (schema.methods.const).to.be.a.function;

    Person = mongodb.model ('person', schema, 'blueprint_persons');
    expect (Person.const ()).to.eql (['creator']);
  });

  describe ('save', function () {
    it ('should not update a const field', function (done) {
      async.waterfall ([
        function (callback) {
          var person = new Person ({first_name: 'James', last_name: 'Hill', creator: 'me'});
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
          Person.findById (person._id, callback);
        },

        function (person, callback) {
          expect (person.creator).to.equal ('me');
          return callback (null);
        }
      ], done);
    });
  });
});