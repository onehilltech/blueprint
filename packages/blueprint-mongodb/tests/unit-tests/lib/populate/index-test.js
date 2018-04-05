const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');

const lean = require ('../../../../lib/lean');

const {
  populateModel,
  populateModels
} = require ('../../../../lib/populate');

describe ('lib | populate', function () {
  beforeEach (function () {
    return Promise.all (
      [
        blueprint.lookup ('model:author').remove (),
        blueprint.lookup ('model:user').remove ()
      ]
    ).then (() => blueprint.lookup ('model:author').create (
      [
        {name: 'John Doe'},
        {name: 'Robert Young'},
        {name: 'Tom Smith'}
        ]
      )
    ).then ((authors) => blueprint.lookup ('model:user').create ([
      {first_name: 'Paul', last_name: 'Black', favorite_author: authors[0]._id, blacklist: [authors[0]._id, authors[1]._id]},
      {first_name: 'John', last_name: 'Smith', favorite_author: authors[0]._id}
      ])
      );
  });

  describe ('populateModel', function () {
    it ('should populate a model', function () {
      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const promises = [
        User.find ({first_name: 'Paul', last_name: 'Black'}),
        Author.find ()
      ];

      return Promise.all (promises)
        .then (([users,authors]) => {
          return populateModel (users[0])
            .then (models => {
              expect (models).to.have.keys (['authors','users']);

              expect (lean (models.authors)).to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
              expect (lean (models.users)).to.have.deep.members ([users[0].lean ()]);
            });
        });
    });
  });

  describe ('populateModels', function () {
    it ('should populate a group models', function () {
      const User = blueprint.lookup ('model:user');
      const Author = blueprint.lookup ('model:author');

      const promises = [
        User.find (),
        Author.find ()
      ];

      return Promise.all (promises)
        .then (([users,authors]) => {
          return populateModels (users)
            .then (models => {
              expect (models).to.have.keys (['authors','users']);

              expect (lean (models.authors)).to.have.deep.members ([authors[0].lean (), authors[1].lean ()]);
              expect (lean (models.users)).to.have.deep.members ([users[0].lean (), users[1].lean ()]);
            });
        });
    });
  });
});
