const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

const lean = require ('../../../../lib/lean');
const Population = require ('../../../../lib/populate/population');
const ModelRegistry = require ('../../../../lib/populate/model-registry');

function createTestPopulation () {
  const User = blueprint.lookup ('model:user');
  const registry = new ModelRegistry ();
  registry.addModel (User);

  return new Population ({registry});
}

describe ('lib | populate | Population', function () {
  describe ('constructor', function () {
    it ('should create population with no types', function () {
      const registry = new ModelRegistry ();
      let population = new Population ({registry});

      expect (population).to.have.deep.property ('models', {});
      expect (population).to.have.deep.property ('ids', {});
    });

    it ('should create population with types', function () {
      const User = blueprint.lookup ('model:user');
      const registry = new ModelRegistry ();
      registry.addModel (User);

      let population = new Population ({registry});

      expect (population).to.have.deep.property ('models', {users: [], authors: []});
      expect (population).to.have.deep.property ('ids', {users: [], authors: []});
    });
  });

  describe ('addModel', function () {
    it ('should add model to the population', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const promises = [
        User.find ({first_name: 'Paul', last_name: 'Black'}),
        Author.find ()
      ];

      return Promise.all (promises).then (([users,authors]) => {
        return population.addModel (users[0])
          .then (population => {
            const ids = population.ids;
            const models = population.models;

            expect (ids).to.have.keys (['authors','users']);
            expect (models).to.have.keys (['authors','users']);

            expect (lean (models.users)).to.have.deep.members ([users[0].lean ()]);
            expect (lean (models.authors)).to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
          });
      });
    });

    it ('should add same model to the population', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const promises = [
        User.find ({first_name: 'Paul', last_name: 'Black'}),
        Author.find ()
      ];

      return Promise.all (promises).then (([users,authors]) => {
        return population.addModel (users[0])
          .then (population => population.addModel (users[0]))
          .then (population => {
            const ids = population.ids;
            const models = population.models;

            expect (ids).to.have.keys (['authors','users']);
            expect (models).to.have.keys (['authors','users']);

            expect (lean (models.users)).to.have.deep.members ([users[0].lean ()]);
            expect (lean (models.authors)).to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
          });
      });
    });
  });

  describe ('addModels', function () {
    it ('should add models to the population', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const promises = [
        User.find (),
        Author.find ()
      ];

      return Promise.all (promises).then (([users,authors]) => {
        return population.addModels (users).then (population => {
          const ids = population.ids;
          const models = population.models;

          expect (ids).to.have.keys (['authors','users']);
          expect (models).to.have.keys (['authors','users']);

          expect (lean (models.users)).to.have.deep.members (lean (users));
          expect (lean (models.authors)).to.have.deep.members (lean([authors[0], authors[3], authors[1]]));
        });
      });
    });
  });
});