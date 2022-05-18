const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('app | services | dfinity', function () {
  it ('should create a new instance', async function () {
    // We need to increase the timeout since there is a delay in connecting.
    this.timeout (10000);

    // Let's create an instance of the actor.
    const dfinity = blueprint.lookup ('service:dfinity');
    const hello = dfinity.createInstance ('hello');

    expect (hello).to.not.be.undefined;

    // Now, let's call the greet method on the actor.
    const message = await hello.greet ('OneHillTech');
    expect (message).to.equal ('Hello, OneHillTech!');
  });
});