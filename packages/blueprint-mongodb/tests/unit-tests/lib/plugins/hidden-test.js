const mongodb  = require ('../../../../lib');
const {expect} = require ('chai');
const HiddenPlugin = require ('../../../../lib/plugins/hidden');

describe ('lib | plugins | HiddenPlugin', function () {
  let Person;

  it ('should create a schema with the Hidden', function () {
    let schema = new mongodb.Schema ({
      first_name: String,
      last_name: String,

      // This field should be hidden during transformation.
      ssn: {type: String, required: true, hidden: true}
    });

    schema.plugin (HiddenPlugin);

    Person = mongodb.model ('person', schema, 'blueprint_persons');
    expect (Person.hidden ()).to.eql (['ssn']);
  });

  let person;

  describe ('toObject', function () {
    it ('should not transform the hidden fields', function () {
      person = new Person ({first_name: 'James', last_name: 'Hill', ssn: '123456789'});
      let obj = person.toObject ();

      expect (obj).to.eql ({_id: obj._id, first_name: 'James', last_name: 'Hill'});
    });
  });

  describe ('toJSON', function () {
    it ('should not transform the hidden fields', function () {
      person = new Person ({first_name: 'James', last_name: 'Hill', ssn: '123456789'});
      let obj = person.toJSON ();

      expect (obj).to.eql ({_id: obj._id, first_name: 'James', last_name: 'Hill'});
    });
  });
});