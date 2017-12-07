const {expect} = require ('chai');
const path = require ('path');
const loader = require ('../../../lib/loader');

describe ('lib | loader', function () {
  it ('should load all the assets', function (done) {
    let dirname = path.resolve ('./tests/fixtures/loader-test');

    loader ({dirname}).then (assets => {
      expect (assets).to.deep.equal ({
        a: { b: {c: 'c-override', d: 'd' } },
        a1: 'a1'
      });

      done (null);
    }).catch (done);
  });
});
