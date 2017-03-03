'use strict';

const mongodb    = require ('../../../../lib')
  , expect       = require ('chai').expect
  , HiddenPlugin = require ('../../../../lib/plugins/HiddenPlugin')
  , async        = require ('async')
  ;

describe ('lib.plugins.HiddenPlugin', function () {
  var Person;

  it ('should create a schema with the Hidden', function () {
    var schema = new mongodb.Schema ({
      first_name: String,
      last_name: String,

      // This field should be hidden during transformation.
      ssn: {type: String, required: true, hidden: true}
    });

    schema.plugin (HiddenPlugin);

    expect (schema.methods.hidden).to.be.a.function;

    Person = mongodb.model ('person', schema, 'blueprint_persons');
  });

  var person;

  describe ('toObject', function () {
    it ('should not transform the hidden fields', function () {
      person = new Person ({first_name: 'James', last_name: 'Hill', ssn: '123456789'});
      var obj = person.toObject ();

      expect (obj).to.eql ({_id: obj._id, first_name: 'James', last_name: 'Hill'});
    });
  });

  describe ('toJSON', function () {
    it ('should not transform the hidden fields', function () {
      person = new Person ({first_name: 'James', last_name: 'Hill', ssn: '123456789'});
      var obj = person.toJSON ();

      expect (obj).to.eql ({_id: obj._id, first_name: 'James', last_name: 'Hill'});
    });
  });
});