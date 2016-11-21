'use strict';

var exports = module.exports;

exports.auth = require ('./authentication');
exports.authentication = exports.auth;

exports.newClient = require ('./GatekeeperClient');
exports.roles = exports.scopes = require ('./scopes');
exports.tokens = require ('./tokens');

exports.__defineGetter__ ('testing', function () {
  return require ('./testing');
});
