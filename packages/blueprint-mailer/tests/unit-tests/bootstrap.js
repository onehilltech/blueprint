const path  = require ('path');
const blueprint = require ('@onehilltech/blueprint-testing');

const appPath = path.resolve (__dirname, '../dummy/app');
blueprint.bootstrap (appPath);
