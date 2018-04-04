const path = require ('path');
const blueprint = require ('@onehilltech/blueprint');

// The dummy application has a well-defined location.
const appPath = path.resolve ('./tests/dummy/app');

beforeEach (function () {
  return blueprint.createApplicationAndStart (appPath);
});

afterEach (function () {
  return blueprint.destroyApplication ();
});
