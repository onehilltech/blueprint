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

        expect (registry.models).to.have.keys ([aKey]);
        expect (registry.models).to.have.deep.property (ModelRegistry.getKeyFromModel (Author), {});
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

        // favorite_author, blacklist
        expect (registry.models).to.have.keys ([aKey, uKey]);

        // favorite_author
        expect (registry.models).to.have.deep.property (aKey, {});

        // blacklist
        expect (registry.models).to.have.property (uKey).to.have.keys (['favorite_author', 'blacklist', 'bookstore', 'bookstores']);
        expect (registry.models).to.have.property (uKey).to.have.property ('favorite_author').that.is.instanceof (PopulateElement);
        expect (registry.models).to.have.property (uKey).to.have.property ('blacklist').that.is.instanceof (PopulateArray);
      });
    });
  });

  describe ('modelTypes', function () {
    it ('should return a list of model types', function () {
      const User = blueprint.lookup ('model:user');
      const registry = new ModelRegistry ();

      registry.addModel (User);

      expect (registry.modelTypes).to.eql (['user','author']);
    });
  });
});