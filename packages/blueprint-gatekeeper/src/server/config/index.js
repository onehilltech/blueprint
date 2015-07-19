var nconf = require ('nconf')
  , path  = require ('path')
  ;

var env = process.env.NODE_ENV || 'dev';
var configFile = path.join (__dirname, '../config', env + '.json');

nconf.env ().file ({file: configFile}).argv ();
exports = module.exports = nconf;
