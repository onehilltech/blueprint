const Framework = require ('./Framework');

// Create the singleton framework for Blueprint. We are going to export
// the framework from this module, which will get us the access points
// needed to create and start the application.
module.exports = new Framework ();
