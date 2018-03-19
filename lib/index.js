const Framework = require ('./Framework');

// Create the singleton framework for Blueprint. We are going to export
// the framework from this module, which will get us the access points
// needed to create and start the application.
const framework = new Framework ();

module.exports = exports = framework;

/// Load the testing module on demand.

Object.defineProperty (exports, 'testing', {
  get: function () { return require ('./testing'); }
});

exports.messaging = require ('./messaging');
exports.Action = require ('./action');
exports.Controller = require ('./controller');
exports.barrier = require ('./barrier');
