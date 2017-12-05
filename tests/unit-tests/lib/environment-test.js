const Environment = require ('../../../lib/environment');
const expect = require ('chai').expect;

describe ('lib | Environment', function () {
  it ('should create an environment object', function () {
    let env = new Environment ();
    expect (env.name).to.equal ('test');
  });
});