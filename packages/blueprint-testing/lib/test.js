const path = require ('path');
const blueprint = require ('@onehilltech/blueprint');

function test (description, test) {
  // As part of the testing framework, we need to make sure we create/start
  // and destroy the application before and after each test, respectively.
  // We are assuming the dummy application is under ./tests/dummy/app.

  const appPath = path.resolve ('./tests/dummy/app');

  beforeEach (function () {
    return blueprint.createApplicationAndStart (appPath);
  });

  afterEach (function () {
    return blueprint.destroyApplication ();
  });

  describe (description, test);
}

module.exports = test;
