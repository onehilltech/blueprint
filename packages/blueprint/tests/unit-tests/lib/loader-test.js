const {expect} = require ('chai');
const path = require ('path');
const Loader = require ('../../../lib/loader');

describe ('lib | loader', function () {
  it ('should load all the assets', async function () {
    const dirname = path.resolve ('./tests/helpers/loader-test');
    const loader = new Loader ();

    const assets = await loader.load ({ dirname });

    expect (assets).to.deep.equal ({
      a: { b: {c: 'c-override', d: 'd' } },
      a1: 'a1'
    });
  });
});
