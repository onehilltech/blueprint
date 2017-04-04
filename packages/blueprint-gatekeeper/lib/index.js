'use strict';

var exports = module.exports;

exports.auth = require ('./authentication');
exports.authentication = exports.auth;

exports.scope = require ('./scope');
exports.tokens = require ('./tokens');
exports.middleware = require ('../app/middleware');
