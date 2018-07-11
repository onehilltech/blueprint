const path  = require ('path');
const blueprint = require ('@onehilltech/blueprint');

before (function () {
  const appPath = path.resolve (__dirname, '../../app');
  return blueprint.createApplicationAndStart (appPath);
});

beforeEach (function () {
  return blueprint.emit ('blueprint.test.start')
});

afterEach (function () {
  return blueprint.emit ('blueprint.test.complete');
});

after (function () {
  return blueprint.destroyApplication ();
});
