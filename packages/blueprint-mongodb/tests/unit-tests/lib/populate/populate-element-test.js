const blueprint = require ('@onehilltech/blueprint');
const testing   = require ('@onehilltech/blueprint-testing');

const { expect }  = require ('chai');

const PopulateElement = require ('../../../../lib/populate/populate-element');

describe ('lib | populate | PopulateElement', function () {
  beforeEach (function () {
    return Promise.all ([
      blueprint.lookup ('model:author').remove (),
      blueprint.lookup ('model:user').remove ()
    ]).then (() => blueprint.lookup ('model:author').create ({name: 'John Doe'}))
      .then ((author) => blueprint.lookup ('model:user').create ({first_name: 'Jack', last_name: 'Black', favorite_author: author._id}));
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