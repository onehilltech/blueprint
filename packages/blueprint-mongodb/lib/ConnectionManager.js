'use strict';

var mongoose = require ('mongoose')
  ;

var exports = module.exports = ConnectionManager;

function ConnectionManager (opts) {
  this._defaultName = opts.defaultConnection;
  this._connections = {};

  this._connections[this._defaultName] = mongoose.connections[0];
}

ConnectionManager.prototype.__defineGetter__ ('defaultConnection', function () {
  return this._connections[this._defaultName];
});

ConnectionManager.prototype.__defineGetter__ ('connections', function () {
  return this._connections;
});

ConnectionManager.prototype.createConnection = function (name) {
  if (name === this._defaultName)
    return mongoose.connections[0];

  var conn = mongoose.createConnection ();
  this._connections[name] = conn;

  return conn;
};

ConnectionManager.prototype.openConnection = function (name, opts, callback) {
  this._connections[name].open (opts.connstr, opts.database, opts.port, opts.options, callback);
};

ConnectionManager.prototype.getConnection = function (name) {
  return name === this._defaultName ? mongoose.connections[0] : this._connections[name];  
};

var singleton = null;

exports.getConnectionManager = function (opts) {
  if (singleton) return singleton;

  singleton = new ConnectionManager (opts);
  return singleton;
};
