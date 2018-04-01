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
  beforeEach (function () {
    const appPath = resolve ('./tests/dummy/app');

    return blueprint.createApplicationAndStart (appPath)
      .then (() => Promise.all (
        [
          blueprint.lookup ('model:author').remove (),
          blueprint.lookup ('model:user').remove ()
        ])
      ).then (() => blueprint.lookup ('model:author').create (
        [
          {name: 'John Doe'},
          {name: 'Robert Young'},
          {name: 'Tom Smith'}
        ])
      ).then ((authors) => blueprint.lookup ('model:user').create (
        [
          {first_name: 'Paul', last_name: 'Black', favorite_author: authors[0]._id, blacklist: [authors[0]._id, authors[1]._id]},
          {first_name: 'John', last_name: 'Smith', favorite_author: authors[0]._id}
        ])
      );
  });

  afterEach (function () {
    return blueprint.destroyApplication ();
  });

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

  describe ('addModels', function () {
    context ('do not save ids', function () {
      it ('should add models to the population', function () {
        const User = blueprint.lookup ('model:user');

        const registry = new ModelRegistry ();
        registry.addModel (User);

        const population = new Population ({registry});

        return User.find ().then (users => {
          population.addModels ('users', users);

          expect (lean (population.models)).to.eql ({authors: [], users: lean (users)});
          expect (population.ids).to.eql ({authors: [], users: []});
        });
      });
    });

    context ('save ids', function () {
      it ('should add models to population', function () {
        const User = blueprint.lookup ('model:user');

        const registry = new ModelRegistry ();
        registry.addModel (User);

        const population = new Population ({registry});

        return User.find ().then (users => {
          population.addModels ('users', users, true);

          expect (lean (population.models)).to.eql ({authors: [], users: lean (users)});
          expect (population.ids).to.eql ({authors: [], users: [users[0]._id, users[1]._id]});
        });
      });
    });
  });

  describe ('saveUnseenId', function () {
    it ('should save an unseen id', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      return User.find ().then (users => {
        let unseen = population.saveUnseenId ('users', users[0]._id);

        expect (unseen).to.eql (users[0]._id);
      });
    });

    it ('should save an id only once', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      return User.find ().then (users => {
        population.saveUnseenId ('users', users[0]._id);
        let unseen = population.saveUnseenId ('users', users[0]._id);

        expect (unseen).to.be.null;
      });
    });
  });

  describe ('saveUnseenIds', function () {
    it ('should save an unseen id', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');
      return User.find ().then (users => {
        let ids = users.map (user => user._id);
        let unseen = population.saveUnseenId ('users', ids);

        expect (unseen).to.have.members (ids);
      });
    });

    it ('should the same ids only once', function () {
      let population = createTestPopulation ();

      const User = blueprint.lookup ('model:user');

      return User.find ().then (users => {
        let ids = users.map (user => user._id);

        population.saveUnseenIds ('users', ids);
        let unseen = population.saveUnseenIds ('users', ids);

        expect (unseen).to.have.length (0);
      });
    });
  });

  describe ('populateElement', function () {
    it ('should populate an element', function () {
      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const registry = new ModelRegistry ();

      registry.addModel (User);

      const population = new Population ({registry});
      const uKey = ModelRegistry.getKeyFromModel (User);

      const promises = [
        Author.find (),
        User.find (),
      ];

      return Promise.all (promises)
        .then (([authors, users]) => {
          const user = users[0];

          return population.populateElement (uKey, user)
            .then (() => {
              expect (population.ids).to.have.keys (['users','authors']);
              expect (population.ids).to.have.deep.property ('users', []);
              expect (population.ids).to.have.deep.property ('authors').to.have.deep.members ([authors[0]._id, authors[1]._id]);

              const models = lean (population.models);
              expect (models).to.have.keys (['users','authors']);
              expect (models).to.have.deep.property ('users', []);
              expect (models).to.have.deep.property ('authors').to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
            });
        });
    });
  });

  describe ('populateArray', function () {
    it ('should populate an array', function () {
      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const registry = new ModelRegistry ();

      registry.addModel (User);

      const population = new Population ({registry});
      const uKey = ModelRegistry.getKeyFromModel (User);

      const promises = [
        Author.find (),
        User.find (),
      ];

      return Promise.all (promises)
        .then (([authors,users]) => {
          return population.populateArray (uKey, users)
            .then (() => {
              expect (population.ids).to.have.keys (['users','authors']);
              expect (population.ids).to.have.deep.property ('users', []);
              expect (population.ids).to.have.deep.property ('authors').to.have.deep.members ([authors[0]._id, authors[1]._id]);

              const models = lean (population.models);
              expect (models).to.have.keys (['users','authors']);
              expect (models).to.have.deep.property ('users', []);
              expect (models).to.have.deep.property ('authors').to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
            });
        });
    });
  });

  describe ('flatten', function () {
    it ('should flatten the population', function () {
      const User = blueprint.lookup ('model:user');

      const registry = new ModelRegistry ();
      registry.addModel (User);

      const population = new Population ({registry});

      return User.find ().then (users => {
        population.addModels ('users', users);

        let result = population.flatten ();

        expect (lean (result)).to.eql ({authors: [], users: lean (users)});
      });
    });
  });
});