const Framework = require ('./framework');

function createMessageFramework (opts) {
  return new Framework (opts);
}

module.exports = exports = createMessageFramework;

exports.Listener = require ('./listener');
