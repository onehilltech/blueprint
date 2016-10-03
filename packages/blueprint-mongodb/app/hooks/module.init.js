'use strict';

var blueprint         = require ('@onehilltech/blueprint')
  , mongoose          = require ('mongoose')
  , ConnectionManager = require ('./ConnectionManager')
  ;

const DEFAULT_CONNECTION_NAME = '$default';

// Locate the module configuration in the application. If there is no
// configuration, then we need to stop processing. This brings attention
// to the developer to resolve the problem.

var config = blueprint.app.configs['mongodb'];

if (!config)
  throw new Error ('Must define mongodb.config.js configuration');

var defaultConnection = config.defaultConnection || DEFAULT_CONNECTION_NAME;
var connsConfig = config['connections'];

if (!connsConfig || connsConfig.length == 0)
  throw new Error ('Must define at least one connection');

if (!connsConfig[defaultConnection])
  throw new Error ('Default connection configuration not defined');

// Fix deprecation warnings.
mongoose.Promise = config.promiseLibrary || global.Promise;

// Create the connections defined in the configuration. The key is the name
// of the connection, and the value is the connection details.

var opts = {
  defaultConnection: defaultConnection
};

var connMgr = ConnectionManager.getConnectionManager (opts);

for (var key in connsConfig) {
  if (connsConfig.hasOwnProperty (key))
    connMgr.createConnection (key);
}
