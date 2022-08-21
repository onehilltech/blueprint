const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('lib | decorators | actor', function () {
  it ('should bind to an actor', async function () {
    this.timeout (10000);

    const hello = blueprint.lookup ('service:hello');
    const result = await hello.sayHello ('John');

    expect (result).to.equal ('Hello, John!');
  })
});
