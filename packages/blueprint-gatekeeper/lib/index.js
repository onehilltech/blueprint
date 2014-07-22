var nconf = require ('nconf');

// Export the client symbols.
exports.models = require ('./models');
exports.auth   = require ('./authentication');

// Export the server factory.
var server = require ('./server');
exports.server = server;

// Set the default configuration for the library, then load the
// configuration for the library.
nconf.defaults ({
  'NODE_ENV' : 'development'
});

nconf.argv ()
     .env ()
     .file ({ file: './config/' + nconf.get ('NODE_ENV') + '.json' });


if (nconf.get ('daemon')) {
  // Create a new server is running in server mode.
  console.log ('starting the embedded server');
  var app = server ();
  app.start (nconf.get ());
}
