const mongodb  = require ('../../../../lib');
const {expect} = require ('chai');
const StatPlugin = require ('../../../../lib/plugins/stat');

describe ('lib | plugins | StatPlugin', function () {
  let Person;

  it ('should create a schema with the StatPlugin', function () {
    let schema = new mongodb.Schema ({first_name: String, last_name: String});
    schema.plugin (StatPlugin);

    expect (schema.paths).to.have.property ('_stat.created_at');
    expect (schema.paths).to.have.property ('_stat.updated_at');

    Person = mongodb.model ('person', schema, 'blueprint_persons');
  });

  let person;

  describe ('saving a new document', function () {
    describe ('#getCreatedAt', function () {
      it ('should get the date/time the document was created', function () {
        person = new Person ({first_name: 'James', last_name: 'Hill'});

        return person.save ().then (model => {
          expect (model.getCreatedAt ()).to.eql (person._stat.created_at);
          person = model;
        });
      });
    });

    describe ('#getUpdatedAt', function () {
      it ('should not have an updated date/time', function () {
        expect (person.getUpdatedAt ()).to.be.undefined;
      });
    });

    describe ('#isOriginal', function () {
      it ('should see the new document as original', function () {
        expect (person.isOriginal ()).to.be.true;
      });
    });
  });

  describe ('saving an existing document', function () {
    describe ('#getCreatedAt', function () {
      it ('should not change the created_at date/time', function () {
        person.first_name = 'John';

        return person.save ().then (model => {
          expect (model.getCreatedAt ()).to.eql (person.getCreatedAt ());
          person = model;
        });
      });
    });

    describe ('#getUpdatedAt', function () {
      it ('should have an updated date/time', function () {
        expect (person.getUpdatedAt ()).to.not.be.undefined;
      });

      it ('should not be the same as created_at', function () {
        expect (person.getUpdatedAt ()).to.not.eq (person.getCreatedAt ());
      });
    });

    describe ('#isOutdated', function () {
      it ('should see the resource as outdated', function () {
        expect (person.isOutdated (Date.now () - (5 * 24 * 60 * 60))).to.be.true;
      });
    });

    describe ('#isOriginal', function () {
      it ('should see updated document as not original', function () {
        expect (person.isOriginal ()).to.be.false;
      });
    });
  });

  describe ('updating an existing document', function () {
    let updated;

    describe ('#getUpdatedAt', function () {
      it ('should have an updated date/time', function () {
        let person2 = new Person ({first_name: 'John', last_name: 'Doe'});

        return person2.save ()
          .then (model => Person.findByIdAndUpdate (model._id, {$set: {first_name: 'Jack'}}, {new: true}))
          .then (model => {
            expect (model.getUpdatedAt ()).to.not.be.undefined;
            updated = model;
          });
      });
    });

    describe ('#isOutdated', function () {
      it ('should see the resource as outdated', function () {
        expect (updated.isOutdated (Date.now () - (5 * 24 * 60 * 60))).to.be.true;
      });
    });
  });
});