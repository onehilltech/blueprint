var nconf  = require ('nconf'),
    server = require ('./lib/server');

// Load the configuration for node. We use the following order
// where the later overrides the earlier.
//
// 1. environment variables
// 2. file
// 3. command-line

console.log ('starting the server');

nconf.defaults ({
  port : 3000,
  version : 1
});

var env = process.env.NODE_ENV || 'development';
nconf.env ().file ({file: './config/' + env + '.json'}).argv ();

// Create a new server, and start using node configuration.
var app = server ();
app.start (nconf.get ());

