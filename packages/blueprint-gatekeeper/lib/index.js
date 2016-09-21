exports.auth = require ('./authentication');
exports.authentication = exports.auth;
exports.newClient = require ('./GatekeeperClient');
exports.roles = require ('./roles');
exports.tokens = require ('./tokens');

exports.__defineGetter__ ('testing', function () {
  return require ('./testing');
});
