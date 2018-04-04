const {expect}  = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const testing   = require ('@onehilltech/blueprint-testing');
const lean      = require ('../../../lib/lean');

describe ('lib | lean', function () {
  it ('should convert model to raw object', function () {
    const User = blueprint.lookup ('model:user');
    const user = new User ({first_name: 'James', last_name: 'Hill', email: 'james@no-reply.com'});

    const leanUser = lean (user);

    expect (leanUser).to.eql ({
      _id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      blacklist: []
    });
  });
});
