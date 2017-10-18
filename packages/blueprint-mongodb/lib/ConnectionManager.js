'use strict';

let mongoose = require ('mongoose')
  , _        = require ('underscore')
  ;

var exports = module.exports = ConnectionManager;

function ConnectionManager (opts) {
  opts = opts || {};

  this._defaultName = opts.defaultConnection || '$default';
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

  let conn = mongoose.createConnection ();
  this._connections[name] = conn;

  return conn;
};

ConnectionManager.prototype.openConnection = function (name, opts, callback) {
  let conn = this._connections[name];

  if (!conn)
    throw new Error (`Connection ${name} does not exist.`);

  conn.openUri (opts.connstr, _.extend ({useMongoClient: true}, opts.options), callback);
};

ConnectionManager.prototype.getConnection = function (name) {
  return name === this._defaultName ? mongoose.connections[0] : this._connections[name];  
};

let singleton = null;

exports.getConnectionManager = function (opts) {
  if (singleton)
    return singleton;

  singleton = new ConnectionManager (opts);
  return singleton;
};
