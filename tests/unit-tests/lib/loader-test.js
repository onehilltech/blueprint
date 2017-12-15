const {expect} = require ('chai');
const path = require ('path');
const Loader = require ('../../../lib/loader');

describe ('lib | loader', function () {
  it ('should load all the assets', function (done) {
    let dirname = path.resolve ('./tests/fixtures/loader-test');
    let loader = new Loader ();

    loader.load ({dirname}).then (assets => {
      expect (assets).to.deep.equal ({
        a: { b: {c: 'c-override', d: 'd' } },
        a1: 'a1'
      });

      done (null);
    }).catch (done);
  });
});
