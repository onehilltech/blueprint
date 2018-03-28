const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

const lean = require ('../../../../lib/lean');
const Population = require ('../../../../lib/populate/population');
const ModelRegistry = require ('../../../../lib/populate/model-registry');
const PopulateElement = require ('../../../../lib/populate/populate-element');

describe ('lib | populate | PopulateElement', function () {
  beforeEach (function () {
    const appPath = resolve ('./tests/dummy/app');

    return blueprint.createApplicationAndStart (appPath)
      .then (() => Promise.all ([
        blueprint.lookup ('model:author').remove (),
        blueprint.lookup ('model:user').remove ()
      ]))
      .then (() => blueprint.lookup ('model:author').create ({name: 'John Doe'}))
      .then ((author) => blueprint.lookup ('model:user').create (
        [
          {first_name: 'Paul', last_name: 'Black', favorite_author: author._id},
          {first_name: 'John', last_name: 'Smith', favorite_author: author._id}
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
    it ('should add models to population', function () {
      const User = blueprint.lookup ('model:user');

      const registry = new ModelRegistry ();
      registry.addModel (User);

      const population = new Population ({registry});

      return User.find ().then (users => {
        population.addModels ('users', users);

        expect (lean (population.models)).to.eql ({authors: [], users: [lean (users)]});
        expect (population.ids).to.eql ({authors: [], users: [[users[0].id, users[1].id]]});
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

  describe ('populateElement', function () {
    it ('should populate an element', function () {
      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const registry = new ModelRegistry ();
      const uKey = ModelRegistry.getKeyFromModel (User);
      const aKey = ModelRegistry.getKeyFromModel (Author);

      registry.models[uKey] = new PopulateElement ({Model: User});
      registry.models[aKey] = new PopulateElement ({Model: Author});

      const population = new Population ({registry});

      return User.find ().then (users => {
        return population.populateElement (uKey, users)
      });
    });
  });
});