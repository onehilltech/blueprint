const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('services | urls', function () {
  it ('should load aliases', async function () {
    const urls = blueprint.lookup ('service:urls');

    expect (urls).to.include ( {
      a1: 'https://localhost:8080',
      a2: 'https://localhost:9000',
    })
  });
});
