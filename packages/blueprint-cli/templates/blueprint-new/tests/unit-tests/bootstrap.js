const path  = require ('path');
const blueprint = require ('@onehilltech/blueprint');
const debug = require ('debug')('bootstrap');

before (function () {
  const appPath = path.resolve (__dirname, '../dummy/app');
  return blueprint.createApplicationAndStart (appPath);
});

beforeEach (function () {
  debug ('starting a new test');
  return blueprint.emit ('blueprint.test.start')
});

afterEach (function () {
  debug ('ending the test');
  return blueprint.emit ('blueprint.test.complete');
});

after (function () {
  return blueprint.destroyApplication ();
});
