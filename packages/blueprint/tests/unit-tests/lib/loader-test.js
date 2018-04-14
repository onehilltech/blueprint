const {expect} = require ('chai');
const path = require ('path');
const Loader = require ('../../../lib/loader');

describe ('lib | loader', function () {
  it ('should load all the assets', function () {
    let dirname = path.resolve ('./tests/helpers/loader-test');
    let loader = new Loader ();

    return loader.load ({dirname}).then (assets => {
      expect (assets).to.deep.equal ({
        a: { b: {c: 'c-override', d: 'd' } },
        a1: 'a1'
      });
    });
  });
});
