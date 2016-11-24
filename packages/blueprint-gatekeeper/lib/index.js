'use strict';

var passport = require ('passport')
  ;

var exports = module.exports;

exports.auth = require ('./authentication');
exports.authentication = exports.auth;

exports.newClient = require ('./GatekeeperClient');
exports.scope = require ('./scope');
exports.tokens = require ('./tokens');

exports.__defineGetter__ ('testing', function () {
  return require ('./testing');
});

function protect () {
  return passport.authenticate ('bearer', {session: false});
}

exports.protect = protect;
