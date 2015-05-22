var nconf = require ('nconf')
  , winston = require ('winston')
  , models = require ('./lib/models');

var Account = models.Account;

// Export the server factory.
var Server = require ('./lib/server');
exports.Server = Server;

// Load the node configuration.
var env = process.env.NODE_ENV || 'development';
winston.info ('execution environment: ' + env);

nconf.env ().file ({file: './config/' + env + '.json'}).argv ();
var config = nconf.get ();

if (nconf.get ('daemon')) {
  // Create a new server is running in server mode.
  var daemon = Server ();

  winston.debug ('running the embedded server');
  daemon.start (nconf.get ('daemon'));

  // Export the daemon from the module.
  exports.daemon = daemon;
}
