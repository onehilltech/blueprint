const blueprint  = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

const ModelRegistry = require ('../../../../lib/populate/model-registry');
const PopulateElement = require ('../../../../lib/populate/populate-element');
const PopulateArray = require ('../../../../lib/populate/populate-array');

describe ('lib | populate | ModelRegistry', function () {
  describe ('addModel', function () {
    context ('no populate fields', function () {
      it ('should add a model to the model registry', function () {
        const Author = blueprint.lookup ('model:author');
        const registry = new ModelRegistry ();

        registry.addModel (Author);

        const aKey = ModelRegistry.getKeyFromModel (Author);
        const models = registry.models;

        expect (models).to.have.keys ([aKey]);
        expect (models).to.have.nested.property (`${aKey}.Model`).to.equal (Author);
        expect (models).to.have.nested.property (`${aKey}.populators`).to.eql ({});
      });
    });

    context ('populate fields', function () {
      it ('should add multiple models to registry', function () {
        const User = blueprint.lookup ('model:user');
        const Author = blueprint.lookup ('model:author');

        const registry = new ModelRegistry ();

        registry.addModel (User);

        const aKey = ModelRegistry.getKeyFromModel (Author);
        const uKey = ModelRegistry.getKeyFromModel (User);
        const models = registry.models;

        // favorite_author, blacklist
        expect (models).to.have.keys ([aKey, uKey]);

        // favorite_author
        expect (models).to.have.nested.property (aKey);
        expect (models).to.have.nested.property (`${aKey}.Model`).to.equal (Author);
        expect (models).to.have.nested.property (`${aKey}.populators`).to.eql ({});

        // blacklist
        expect (models).to.have.nested.property (`${uKey}.populators`).to.have.keys (['favorite_author', 'blacklist', 'bookstore', 'bookstores']);
        expect (models).to.have.nested.property (`${uKey}.populators`).to.have.property ('favorite_author').that.is.instanceof (PopulateElement);
        expect (models).to.have.nested.property (`${uKey}.populators`).to.have.property ('blacklist').that.is.instanceof (PopulateArray);
      });
    });
  });

  describe ('collectionNames', function () {
    it ('should return a list of model types', function () {
      const User = blueprint.lookup ('model:user');
      const registry = new ModelRegistry ();

      registry.addModel (User);

      expect (registry.collectionNames).to.have.members (['users','authors']);
    });
  });
});