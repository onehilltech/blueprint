var nconf   = require ('nconf')
  , path    = require ('path')
  , winston = require ('winston')
  ;

// Locate the correct configuration file.
var env = process.env.NODE_ENV || 'dev';
var configFile = path.join (__dirname, '../config', env + '.json');
winston.info ('configuration=' + configFile);

// Load the configuration file for the environment.
nconf.env ().file ({file: configFile}).argv ();

// Add the environment to the configuration.
nconf.set ('env', env);

exports = module.exports = nconf;
