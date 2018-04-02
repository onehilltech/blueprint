const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

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
});