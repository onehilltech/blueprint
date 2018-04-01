const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

const lean = require ('../../../../lib/lean');
const PopulateElement = require ('../../../../lib/populate/populate-element');
const Population  = require ('../../../../lib/populate/population');
const ModelRegistry = require ('../../../../lib/populate/model-registry');

describe ('lib | populate | PopulateElement', function () {
  beforeEach (function () {
    const appPath = resolve ('./tests/dummy/app');

    return blueprint.createApplicationAndStart (appPath)
      .then (() => Promise.all ([
        blueprint.lookup ('model:author').remove (),
        blueprint.lookup ('model:user').remove ()
      ]))
      .then (() => blueprint.lookup ('model:author').create ({name: 'John Doe'}))
      .then ((author) => blueprint.lookup ('model:user').create ({first_name: 'Jack', last_name: 'Black', favorite_author: author._id}));
  });

  afterEach (function () {
    return blueprint.destroyApplication ();
  });

  describe ('populate', function () {
    it ('should populate an element', function () {
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: User});

      return User.find ().then (users => {
        let user = users[0];

        return populate.populate (user._id).then (u => {
          expect (u.lean ()).to.eql (user.lean ());
        });
      });
    });
  });

  describe ('saveUnseenIds', function () {
    it ('should return a list of unseen ids', function () {
      const User = blueprint.lookup ('model:user');
      const registry = new ModelRegistry ();
      registry.addModel (User);

      const populate = new PopulateElement ({Model: User});
      const population = new Population ({registry});

      return User.find ().then (users => {
        let user = users[0];
        let unseen = populate.saveUnseenIds (user._id, population);

        expect (unseen).to.eql (user._id);
        expect (population.ids).to.have.property ('users').to.have.members ([user._id]);
      });
    });

    it ('should return an empty value', function () {
      const User = blueprint.lookup ('model:user');
      const registry = new ModelRegistry ();
      registry.addModel (User);

      const populate = new PopulateElement ({Model: User});
      const population = new Population ({registry});

      return User.find ().then (users => {
        let user = users[0];

        populate.saveUnseenIds (user._id, population);
        let unseen = populate.saveUnseenIds (user._id, population);

        expect (unseen).to.be.null;
        expect (population.ids).to.have.property ('users').to.have.members ([user._id]);
      });
    });
  });
});