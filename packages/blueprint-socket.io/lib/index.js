var SocketIO = require ('socket.io')
  ;

var singleton = null;

function SocketManager (opts) {
  opts = opts || {};

  this._io = opts.http ? SocketIO (opts.http) : null;
  this._ios = opts.https ? SocketIO (opts.https) : null;
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
