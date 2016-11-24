var SocketIO  = require ('socket.io')
  , blueprint = require ('@onehilltech/blueprint')
  , _         = require ('underscore')
  ;

var singleton = null;

const DEFAULT_NAMESPACE = '/';

function SocketWrapper (io) {
  this.io = io;
}

SocketWrapper.prototype.listen = function (nsp, callback) {
  var self = this;

  if (_.isFunction (nsp)) {
    callback = nsp;
    nsp = DEFAULT_NAMESPACE;
  }

  blueprint.messaging.on ('app.init', function (app) {
    self.io.of (nsp).on ('connection', callback);
  });
};

function SocketManager (opts) {
  opts = opts || {};

  this._io = opts.http ? new SocketWrapper (SocketIO (opts.http)) : null;
  this._ios = opts.https ? new SocketWrapper (SocketIO (opts.https)) : null;
}

SocketManager.prototype.__defineGetter__ ('io', function () {
  return this._io;
});

SocketManager.prototype.__defineGetter__ ('ios', function () {
  return this._ios;
});

var exports = module.exports = function (opts) {
  if (singleton != null) return singleton;

  singleton = new SocketManager (opts);
  return singleton;
};

exports.SocketIO = SocketIO;

Object.defineProperty (exports, 'io', {
  get: function () { return singleton.io; }
});

Object.defineProperty (exports, 'ios', {
  get: function () { return singleton.ios; }
});
