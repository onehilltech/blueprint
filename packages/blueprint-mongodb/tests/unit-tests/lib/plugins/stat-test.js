const mongodb  = require ('../../../../lib');
const {expect} = require ('chai');
const StatPlugin = require ('../../../../lib/plugins/stat');

describe ('lib | plugins | StatPlugin', function () {
  let Person;
  let PersonSoftDelete;

  describe ('plugin', function () {
    it ('should add plugin to schema', function () {
      let schema = new mongodb.Schema ({first_name: String, last_name: String});
      schema.plugin (StatPlugin);

      expect (schema.paths).to.have.property ('_stat.created_at');
      expect (schema.paths).to.have.property ('_stat.updated_at');

      Person = mongodb.model ('person', schema, 'blueprint_persons');
    });

    context ('soft delete', function () {
      it ('should add plugin to schema with delete property', function () {
        let schema = new mongodb.Schema ({first_name: String, last_name: String}, {softDelete: true});
        schema.plugin (StatPlugin);

        expect (schema.paths).to.have.property ('_stat.created_at');
        expect (schema.paths).to.have.property ('_stat.updated_at');
        expect (schema.paths).to.have.property ('_stat.deleted_at');

        PersonSoftDelete = mongodb.model ('person', schema, 'blueprint_persons');
      });

      it ('should not allow unique fields', function () {
        let schema = new mongodb.Schema ({
          first_name: {type: String, unique: true},
          last_name: String,
        }, {softDelete: true});

        expect (() => { schema.plugin (StatPlugin) }).to.throw ('first_name cannot be unique and support soft delete');
      })
    });
  });

  describe ('save', function () {
    describe ('new document', function ()  {
      it ('should get the date/time the document was created', function () {
        let person = new Person ({first_name: 'James', last_name: 'Hill'});

        return person.save ().then (model => {
          expect (model.created_at).to.eql (person._stat.created_at);
          expect (person.updated_at).to.equal (undefined);
          expect (person.is_original).to.equal (true);
        });
      });

      context ('soft delete', function () {
        it ('should not update the deleted_at property', function () {
          let person = new PersonSoftDelete ({first_name: 'James', last_name: 'Hill'});

          return person.save ().then (model => {
            expect (model._stat.deleted_at).to.equal (undefined);
          });
        });
      });
    });

    describe ('existing document', function () {
      it ('should not change the created_at', function () {
        let person = new Person ({first_name: 'James', last_name: 'Hill'});
        person.first_name = 'John';

        return person.save ().then (person => {
          // Update the person, and save it again.
          person.first_name = 'John';

          return person.save ().then (model => {
            expect (model.created_at).to.eql (person.created_at);
            expect (person.updated_at).be.a ('date');
            expect (person.updated_at).to.not.eq (person.created_at);

            expect (person.outdated (Date.now () - (5 * 24 * 60 * 60))).to.equal (true);
            expect (person.is_original).to.equal (false);
          });
        });
      });

      context ('soft delete', function () {
        it ('should not change the created_at', function () {
          let person = new PersonSoftDelete ({first_name: 'James', last_name: 'Hill'});
          person.first_name = 'John';

          return person.save ().then (person => {
            // Update the person, and save it again.
            person.first_name = 'John';

            return person.save ().then (model => {
              expect (model.created_at).to.eql (person.created_at);
              expect (person.updated_at).be.a ('date');
              expect (person.updated_at).to.not.eq (person.created_at);

              expect (person.outdated (Date.now () - (5 * 24 * 60 * 60))).to.equal (true);
              expect (person.is_original).to.equal (false);
            });
          });
        });
      });
    });
  });

  describe ('update', function () {
    it ('should update an existing document', function () {
      let person = new Person ({first_name: 'James', last_name: 'Hill'});
      person.first_name = 'John';

      return person.save ()
        .then (model => Person.findByIdAndUpdate (model._id, {$set: {first_name: 'Jack'}}, {new: true}))
        .then (model => {
          expect (model.updated_at).to.a ('date');
          expect (model.outdated (Date.now () - (5 * 24 * 60 * 60))).to.be.true;

        });
    });
  });
});