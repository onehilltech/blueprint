'use strict';

var exports = module.exports;

exports.auth = require ('./authentication');
exports.authentication = exports.auth;

exports.newClient = require ('./GatekeeperClient');
exports.scope = require ('./scope');
exports.tokens = require ('./tokens');
exports.protect = require ('./protect');

exports.__defineGetter__ ('testing', function () {
  return require ('./testing');
});



