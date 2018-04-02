const blueprint   = require ('@onehilltech/blueprint');
const { expect }  = require ('chai');
const { resolve } = require ('path');

const lean = require ('../../../../lib/lean');
const populate = require ('../../../../lib/populate/index');

describe ('lib | populate | index', function () {
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

  it ('should populate a model', function () {
    const User = blueprint.lookup ('model:user');

    return User.find ({}).then (users => populate ()
    );
  });
});
