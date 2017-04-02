'use strict';

const _   = require ('underscore')
  , util  = require ('util')
  , debug = require ('debug') ('blueprint:protocol')
  ;

/**
 * @class Protocol
 */
function Protocol (name, server, port) {
  this.name = name;
  this._server = server;
  this.port = port;
}

/**
 * Instruct the protocol to start listening for events.
 *
 * @param port
 * @param callback
 */
Protocol.prototype.listen = function (port, callback) {
  if (!callback)
    callback = port;

  if (_.isFunction (port))
    port = this.port;

  port = port || this.port;

  debug (util.format ('[%s]: listening on port %d', this.name, port));
  this._server.listen (port, callback);
};

Protocol.prototype.__defineGetter__ ('server', function () {
  return this._server;
});

Protocol.prototype.close = function (callback) {
  if (!this._server.listening)
    return callback (null);

  this._server.close (callback);
};

module.exports = Protocol;
