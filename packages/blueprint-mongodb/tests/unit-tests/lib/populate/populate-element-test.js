const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

const lean = require ('../../../../lib/lean');
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

  describe ('merge', function () {
    it ('should merge the model into a new population', function () {
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: User});

      return User.find ().then (users => {
        let user = users[0];
        let population = {};

        populate.merge (user, population);

        expect (lean (population)).to.eql ({
          users: [user.lean ()]
        });
      });
    });

    it ('should merge the model into a existing population', function () {
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: User});

      return User.find ().then (users => {
        let user = users[0];
        let population = {
          users: [user.lean ()]
        };

        populate.merge (user, population);

        expect (lean (population)).to.eql ({
          users: [user.lean (), user.lean ()]
        });
      });
    });
  });

  describe ('getUnseenIds', function () {
    it ('should get a list of unseen ids', function () {
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: User});

      return User.find ().then (users => {
        let user = users[0];
        let ids = {};

        let unseen = populate.getUnseenIds (user.favorite_author, ids);

        expect (unseen).to.eql (user.favorite_author);
        expect (ids).to.eql ({users: [user.favorite_author.toString ()]});
      });
    });

    it ('should return an empty list of unseen ids', function () {
      const Author = blueprint.lookup ('model:author');
      const User = blueprint.lookup ('model:user');
      const populate = new PopulateElement ({Model: Author});

      return User.find ().then (users => {
        let user = users[0];
        let ids = {
          authors: [user.favorite_author.toString ()]
        };

        let unseen = populate.getUnseenIds (user.favorite_author, ids);

        expect (unseen).to.be.null;
        expect (ids).to.eql ({authors: [user.favorite_author.toString ()]});
      });
    });
  });
});